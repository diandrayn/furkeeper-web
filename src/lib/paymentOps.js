import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { HttpError } from '@/lib/http';
import { notify } from '@/lib/notify';
import { createSnapTransaction, expireMidtransTransaction, getMidtransStatus } from '@/lib/midtrans';

const PAYMENT_EXPIRY_HOURS = 24;
const FINAL_STATUSES = ['paid', 'expired', 'failed', 'refunded'];

const paymentInclude = {
  orders: {
    include: {
      items: {
        include: {
          store: { select: { owner_id: true, name: true } },
        },
      },
    },
  },
};

function appUrl() {
  return (process.env.APP_URL || 'http://localhost:3000').replace(/\/+$/, '');
}

function itemName(value) {
  return String(value || 'Item').slice(0, 50);
}

function mapPaymentRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    midtransOrderId: row.midtrans_order_id,
    grossAmount: row.gross_amount,
    status: row.status,
    snapToken: row.snap_token,
    snapRedirectUrl: row.snap_redirect_url,
    transactionId: row.transaction_id,
    paymentType: row.payment_type,
    fraudStatus: row.fraud_status,
    paidAt: row.paid_at ? new Date(row.paid_at).getTime() : null,
    expiresAt: row.expires_at ? new Date(row.expires_at).getTime() : null,
    createdAt: new Date(row.created_at).getTime(),
    orderIds: (row.orders || []).map((order) => order.id),
  };
}

function mapMidtransStatus(transactionStatus, fraudStatus) {
  switch (transactionStatus) {
    case 'capture':
      return fraudStatus === 'accept' ? 'paid' : 'challenge';
    case 'settlement':
      return 'paid';
    case 'pending':
      return 'pending';
    case 'deny':
    case 'cancel':
      return 'failed';
    case 'expire':
      return 'expired';
    case 'refund':
    case 'partial_refund':
      return 'refunded';
    case 'chargeback':
    case 'partial_chargeback':
      return 'challenge';
    default:
      return 'pending';
  }
}

function shouldIgnoreTransition(current, next) {
  if (current === next) return false;
  if (current === 'paid' && ['pending', 'failed', 'expired'].includes(next)) return true;
  if (['expired', 'failed'].includes(current) && next === 'pending') return true;
  return false;
}

function collectOwnerIds(orders) {
  return [
    ...new Set(
      orders
        .flatMap((order) => order.items.map((item) => item.store?.owner_id))
        .filter(Boolean),
    ),
  ];
}

async function notifyPaymentResult(result) {
  const { status, orderIds, buyerId, ownerIds } = result;
  const firstOrder = orderIds[0];

  if (buyerId && firstOrder) {
    const paid = status === 'paid';
    const failed = ['expired', 'failed'].includes(status);
    await notify(buyerId, {
      type: 'payment_status',
      title: paid ? 'Pembayaran berhasil' : `Status pembayaran: ${status}`,
      body: paid
        ? `Pesanan #${firstOrder.slice(0, 8)} sudah dibayar dan sedang diproses.`
        : failed
          ? `Pembayaran pesanan #${firstOrder.slice(0, 8)} ${status === 'expired' ? 'kedaluwarsa' : 'gagal'}. Pesanan masih tersimpan — silakan bayar ulang.`
          : `Status pembayaran pesanan #${firstOrder.slice(0, 8)} menjadi ${status}.`,
      link: `/pesanan/${firstOrder}`,
    });
  }

  if (status === 'paid') {
    await Promise.all(
      ownerIds.map((ownerId) =>
        notify(ownerId, {
          type: 'order_paid',
          title: `Pesanan #${firstOrder?.slice(0, 8) || ''} sudah dibayar`,
          body: 'Pembayaran sudah diterima. Pesanan siap diproses.',
          link: '/dashboard/toko/pesanan',
        }),
      ),
    );
  }
}

async function applyPaymentStatus(payment, payload) {
  const nextStatus = mapMidtransStatus(payload.transaction_status, payload.fraud_status);
  const paidNow = nextStatus === 'paid';
  const failureNow = ['expired', 'failed'].includes(nextStatus);

  const result = await prisma.$transaction(async (tx) => {
    const fresh = await tx.payments.findUnique({
      where: { id: payment.id },
      include: paymentInclude,
    });
    if (!fresh) return { ignored: true };

    if (payload.gross_amount !== undefined && Number(payload.gross_amount) !== fresh.gross_amount) {
      throw new HttpError(400, 'Nominal notifikasi tidak cocok.');
    }

    const metadata = {
      raw_notification: payload,
      transaction_id: payload.transaction_id || fresh.transaction_id,
      payment_type: payload.payment_type || fresh.payment_type,
      fraud_status: payload.fraud_status || fresh.fraud_status,
    };

    const summary = {
      ok: true,
      status: fresh.status,
      orderIds: fresh.orders.map((order) => order.id),
      buyerId: fresh.orders[0]?.buyer_id || null,
      ownerIds: collectOwnerIds(fresh.orders),
    };

    if (fresh.status === nextStatus) {
      await tx.payments.update({ where: { id: fresh.id }, data: metadata });
      return { ...summary, unchanged: true };
    }

    if (shouldIgnoreTransition(fresh.status, nextStatus)) {
      await tx.payments.update({ where: { id: fresh.id }, data: metadata });
      return { ...summary, unchanged: true };
    }

    // Conditional update so two concurrent notifications for the same
    // transition cannot both apply order/stock changes.
    const transition = await tx.payments.updateMany({
      where: { id: fresh.id, status: fresh.status },
      data: {
        ...metadata,
        status: nextStatus,
        paid_at: paidNow && !fresh.paid_at ? new Date() : fresh.paid_at,
      },
    });

    if (transition.count === 0) {
      return { ...summary, unchanged: true };
    }

    // Checkout no longer asks for a payment method; the real one is whatever
    // the buyer picked inside Snap, reported by Midtrans.
    if (metadata.payment_type) {
      await tx.orders.updateMany({
        where: { id: { in: fresh.orders.map((order) => order.id) } },
        data: { payment_method: metadata.payment_type },
      });
    }

    if (paidNow) {
      for (const order of fresh.orders) {
        const moved = await tx.orders.updateMany({
          where: { id: order.id, status: 'pending_payment' },
          data: { status: 'processing' },
        });
        if (moved.count === 0) continue;
        await tx.order_status_history.create({
          data: {
            order_id: order.id,
            status: 'processing',
            from_status: 'pending_payment',
            to_status: 'processing',
            changed_by: null,
            note: 'Pembayaran Midtrans diterima',
          },
        });
      }
    } else if (failureNow) {
      // A failed/expired payment must NOT cancel the order: the buyer is
      // allowed to create a new payment for the same order (the stock stays
      // reserved until the buyer or seller cancels the order explicitly).
      for (const order of fresh.orders) {
        if (order.status !== 'pending_payment') continue;
        await tx.order_status_history.create({
          data: {
            order_id: order.id,
            status: 'pending_payment',
            from_status: 'pending_payment',
            to_status: 'pending_payment',
            changed_by: null,
            note: `Pembayaran ${nextStatus} — pesanan menunggu pembayaran ulang`,
          },
        });
      }
    }

    return {
      ...summary,
      status: nextStatus,
      unchanged: false,
    };
  });

  if (result.ok && !result.unchanged) {
    await notifyPaymentResult(result);
  }
  return result;
}

/**
 * Close a payment that is being replaced by a new one. The Midtrans token is
 * expired first so the buyer cannot pay both the old and the new transaction.
 */
async function retireSupersededPayment(payment, orderIds) {
  if (!payment || ['paid', 'refunded'].includes(payment.status)) return;

  const linked = await prisma.orders.findMany({
    where: { payment_id: payment.id },
    select: { id: true },
  });
  const linkedIds = linked.map((row) => row.id);
  if (!linkedIds.every((id) => orderIds.includes(id))) return;

  try {
    await expireMidtransTransaction(payment.midtrans_order_id);
  } catch (err) {
    // 404 means Midtrans never saw this transaction (the Snap token was
    // created but never opened), so there is nothing to expire.
    console.warn('[midtrans] gagal menutup transaksi lama:', err?.message || err);
  }

  await prisma.payments.updateMany({
    where: { id: payment.id, status: { in: ['pending', 'challenge'] } },
    data: { status: 'expired' },
  });
}

export async function createPaymentForOrders(user, orderIds) {
  const ids = [...new Set((orderIds || []).filter(Boolean))];
  if (!ids.length) throw new HttpError(400, 'Pesanan tidak ditemukan.');

  const orders = await prisma.orders.findMany({
    where: { id: { in: ids } },
    include: { items: true, payment: true },
  });
  if (orders.length !== ids.length) throw new HttpError(404, 'Sebagian pesanan tidak ditemukan.');

  for (const order of orders) {
    if (order.buyer_id !== user.id) throw new HttpError(403, 'Pesanan ini bukan milikmu.');
    if (order.status !== 'pending_payment') {
      throw new HttpError(400, `Pesanan #${order.id.slice(0, 8)} tidak menunggu pembayaran.`);
    }
  }

  const existing = orders.map((order) => order.payment).find(Boolean);
  if (existing) {
    if (existing.status === 'paid') throw new HttpError(400, 'Pesanan ini sudah dibayar.');
    if (existing.status === 'challenge') {
      throw new HttpError(
        409,
        'Pembayaran pesanan ini masih ditinjau Midtrans. Tunggu hasilnya sebelum membayar lagi.',
      );
    }

    const stillValid =
      existing.status === 'pending' &&
      existing.snap_token &&
      existing.expires_at &&
      new Date(existing.expires_at).getTime() > Date.now();

    if (stillValid) {
      const linked = await prisma.orders.findMany({
        where: { payment_id: existing.id },
        select: { id: true },
      });
      const linkedIds = linked.map((row) => row.id);
      if (ids.every((id) => linkedIds.includes(id))) {
        return mapPaymentRow({ ...existing, orders });
      }
    }

    // The old payment is expired/failed (or no longer covers exactly these
    // orders). Close it before issuing a new token so nothing is paid twice.
    await retireSupersededPayment(existing, ids);
  }

  const grossAmount = orders.reduce((sum, order) => sum + order.total, 0);
  if (grossAmount < 1) throw new HttpError(400, 'Total pembayaran tidak valid.');

  const itemDetails = [];
  for (const order of orders) {
    for (const item of order.items) {
      itemDetails.push({
        id: item.product_id || item.id,
        price: item.price,
        quantity: item.quantity,
        name: itemName(item.name),
      });
    }
    if (order.shipping_cost > 0) {
      itemDetails.push({
        id: `shipping-${order.id.slice(0, 8)}`,
        price: order.shipping_cost,
        quantity: 1,
        name: 'Ongkos Kirim',
      });
    }
  }

  const itemsTotal = itemDetails.reduce((sum, item) => sum + item.price * item.quantity, 0);
  if (itemsTotal !== grossAmount) {
    throw new HttpError(500, 'Total pesanan tidak konsisten.');
  }

  const paymentId = crypto.randomUUID();
  const midtransOrderId = `FK-${paymentId}`;
  const expiresAt = new Date(Date.now() + PAYMENT_EXPIRY_HOURS * 60 * 60 * 1000);

  const payment = await prisma.payments.create({
    data: {
      id: paymentId,
      midtrans_order_id: midtransOrderId,
      gross_amount: grossAmount,
      status: 'pending',
      expires_at: expiresAt,
    },
  });

  try {
    const transaction = await createSnapTransaction({
      orderId: midtransOrderId,
      grossAmount,
      itemDetails,
      customerDetails: {
        first_name: (user.full_name || 'Pembeli').slice(0, 50),
        email: user.email || undefined,
        phone: user.phone || undefined,
      },
      finishUrl: `${appUrl()}/pembayaran/sukses?payment=${payment.id}`,
      expiryHours: PAYMENT_EXPIRY_HOURS,
    });

    const updated = await prisma.$transaction(async (tx) => {
      await tx.payments.update({
        where: { id: payment.id },
        data: {
          snap_token: transaction.token,
          snap_redirect_url: transaction.redirect_url,
        },
      });
      await tx.orders.updateMany({
        where: { id: { in: ids } },
        data: { payment_id: payment.id },
      });
      return tx.payments.findUnique({
        where: { id: payment.id },
        include: paymentInclude,
      });
    });

    return mapPaymentRow(updated);
  } catch (err) {
    await prisma.payments
      .update({ where: { id: payment.id }, data: { status: 'failed' } })
      .catch(() => {});
    console.error('Midtrans createTransaction failed:', err);
    throw new HttpError(502, 'Gagal membuat transaksi pembayaran. Coba lagi.');
  }
}

export async function applyMidtransNotification(payload) {
  if (!payload?.order_id) return { ignored: true };

  const payment = await prisma.payments.findUnique({
    where: { midtrans_order_id: payload.order_id },
    include: paymentInclude,
  });
  if (!payment) return { ignored: true };

  return applyPaymentStatus(payment, payload);
}

export async function syncPaymentStatus(user, paymentId) {
  const payment = await prisma.payments.findUnique({
    where: { id: paymentId },
    include: paymentInclude,
  });
  if (!payment) throw new HttpError(404, 'Pembayaran tidak ditemukan.');

  const owns = payment.orders.some((order) => order.buyer_id === user.id);
  if (!owns && user.role !== 'admin') throw new HttpError(403, 'Akses ditolak.');

  if (FINAL_STATUSES.includes(payment.status)) return mapPaymentRow(payment);

  let status;
  try {
    status = await getMidtransStatus(payment.midtrans_order_id);
  } catch (err) {
    // Snap tokens that were created but never opened can be unknown to
    // Midtrans. Keep the local pending record instead of failing the page.
    const unknownTransaction =
      err?.httpStatusCode === 404 || /HTTP status code:\s*404/.test(String(err?.message || ''));
    if (unknownTransaction) return mapPaymentRow(payment);
    throw err;
  }
  await applyPaymentStatus(payment, status);

  const updated = await prisma.payments.findUnique({
    where: { id: paymentId },
    include: paymentInclude,
  });
  return mapPaymentRow(updated);
}

export async function fetchPaymentForUser(user, paymentId) {
  const payment = await prisma.payments.findUnique({
    where: { id: paymentId },
    include: paymentInclude,
  });
  if (!payment) throw new HttpError(404, 'Pembayaran tidak ditemukan.');

  const owns = payment.orders.some((order) => order.buyer_id === user.id);
  if (!owns && user.role !== 'admin') throw new HttpError(403, 'Akses ditolak.');

  return mapPaymentRow(payment);
}

export async function fetchPaymentByMidtransOrderId(user, midtransOrderId) {
  const payment = await prisma.payments.findUnique({
    where: { midtrans_order_id: midtransOrderId },
    include: paymentInclude,
  });
  if (!payment) throw new HttpError(404, 'Pembayaran tidak ditemukan.');

  const owns = payment.orders.some((order) => order.buyer_id === user.id);
  if (!owns && user.role !== 'admin') throw new HttpError(403, 'Akses ditolak.');

  return mapPaymentRow(payment);
}
