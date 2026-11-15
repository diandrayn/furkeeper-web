import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { HttpError } from '@/lib/http';
import { notify } from '@/lib/notify';
import {
  approveOrDenyMidtransTransaction,
  createSnapTransaction,
  expireMidtransTransaction,
  getMidtransStatus,
  refundMidtransTransaction,
} from '@/lib/midtrans';

const PAYMENT_EXPIRY_HOURS = 24;
const FINAL_STATUSES = ['paid', 'expired', 'failed', 'refunded'];
// Orders whose payment failed/expired (or that never got a payment) are
// cancelled automatically during reconciliation once they are this old.
const STALE_ORDER_HOURS = Number(process.env.ORDER_AUTO_CANCEL_HOURS || 72);
// A pending payment row with no Snap token that is younger than this is still
// being built by another request, so a parallel checkout must not replace it.
const CLAIM_WINDOW_MS = 2 * 60 * 1000;
const UNKNOWN_TRANSACTION = /HTTP status code:\s*404|Transaction doesn't exist/i;

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
  const { status, orderIds, buyerId, ownerIds, latePaidOrderIds = [] } = result;
  const firstOrder = orderIds[0];

  if (buyerId && firstOrder) {
    const paid = status === 'paid';
    const failed = ['expired', 'failed'].includes(status);
    const latePaid = latePaidOrderIds.length > 0;
    await notify(buyerId, {
      type: 'payment_status',
      title: latePaid
        ? 'Pembayaran perlu ditindaklanjuti'
        : paid
          ? 'Pembayaran berhasil'
          : `Status pembayaran: ${status}`,
      body: latePaid
        ? `Pembayaran pesanan #${firstOrder.slice(0, 8)} diterima setelah pesanan dibatalkan. Tim FurKeeper akan memproses pengembalian dana (refund).`
        : paid
          ? `Pesanan #${firstOrder.slice(0, 8)} sudah dibayar dan sedang diproses.`
          : failed
            ? `Pembayaran pesanan #${firstOrder.slice(0, 8)} ${status === 'expired' ? 'kedaluwarsa' : 'gagal'}. Pesanan masih tersimpan — silakan bayar ulang.`
            : `Status pembayaran pesanan #${firstOrder.slice(0, 8)} menjadi ${status}.`,
      link: `/pesanan/${firstOrder}`,
    });
  }

  if (latePaidOrderIds.length) {
    const admins = await prisma.profiles.findMany({
      where: { role: 'admin' },
      select: { id: true },
    });
    await Promise.all(
      admins.map((admin) =>
        notify(admin.id, {
          type: 'payment_refund_needed',
          title: 'Pembayaran masuk setelah pesanan dibatalkan',
          body: `Pesanan #${latePaidOrderIds[0].slice(0, 8)} sudah dibatalkan tetapi pembayarannya tetap masuk. Perlu refund manual.`,
          link: '/admin/transaksi',
        }),
      ),
    );
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

    const latePaidOrderIds = [];

    if (paidNow) {
      for (const order of fresh.orders) {
        const moved = await tx.orders.updateMany({
          where: { id: order.id, status: 'pending_payment' },
          data: { status: 'processing' },
        });
        if (moved.count === 0) {
          // The buyer paid but the order is no longer waiting for payment,
          // typically because it was cancelled just before the webhook
          // arrived. The money did arrive, so flag it for a manual refund
          // instead of silently ignoring it.
          if (order.status === 'cancelled') {
            latePaidOrderIds.push(order.id);
            await tx.order_status_history.create({
              data: {
                order_id: order.id,
                status: 'cancelled',
                from_status: 'cancelled',
                to_status: 'cancelled',
                changed_by: null,
                note: 'Pembayaran diterima setelah pesanan dibatalkan — perlu refund manual',
              },
            });
          }
          continue;
        }
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
      latePaidOrderIds,
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

    // The row was created but the Snap token is not written yet, which means
    // another request is still talking to Midtrans. Refusing here stops a
    // double click on "Bayar" from producing two payable tokens.
    const existingCreatedAt = existing.created_at ? new Date(existing.created_at).getTime() : 0;
    if (
      existing.status === 'pending'
      && !existing.snap_token
      && Date.now() - existingCreatedAt < CLAIM_WINDOW_MS
    ) {
      throw new HttpError(
        409,
        'Pembayaran lain sedang dibuat untuk pesanan ini. Muat ulang halaman lalu coba lagi.',
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

  // Atomically claim the orders for this payment. Without this, two
  // simultaneous checkout requests could each create a Snap token and only
  // the last link would win, leaving one payable token unaccounted for.
  const claim = await prisma.orders.updateMany({
    where: {
      id: { in: ids },
      status: 'pending_payment',
      ...(existing
        ? { OR: [{ payment_id: null }, { payment_id: existing.id }] }
        : { payment_id: null }),
    },
    data: { payment_id: payment.id },
  });

  if (claim.count !== ids.length) {
    await prisma.payments
      .update({ where: { id: payment.id }, data: { status: 'failed' } })
      .catch(() => {});
    throw new HttpError(
      409,
      'Pembayaran lain sedang dibuat untuk pesanan ini. Muat ulang halaman lalu coba lagi.',
    );
  }

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
      return tx.payments.findUnique({
        where: { id: payment.id },
        include: paymentInclude,
      });
    });

    return mapPaymentRow(updated);
  } catch (err) {
    // Release the claim so the buyer can retry without being locked to a
    // payment that never got a Snap token.
    await prisma.$transaction([
      prisma.orders.updateMany({
        where: { id: { in: ids }, payment_id: payment.id },
        data: { payment_id: existing ? existing.id : null },
      }),
      prisma.payments.update({ where: { id: payment.id }, data: { status: 'failed' } }),
    ]).catch(() => {});
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

/**
 * Called before an order is cancelled. Makes sure the order is not backed by
 * a live or settled payment, so a cancelled order can never keep real money.
 * Returns `{ ok: false, reason }` when the cancellation must be refused.
 */
export async function closePaymentForCancellation(paymentId) {
  const payment = await prisma.payments.findUnique({ where: { id: paymentId } });
  if (!payment) return { ok: true };
  if (payment.status === 'paid') return { ok: false, reason: 'paid' };
  if (payment.status === 'challenge') return { ok: false, reason: 'challenge' };
  if (!['pending', 'failed', 'expired'].includes(payment.status)) return { ok: true };

  if (payment.status === 'pending') {
    try {
      // The buyer may have paid seconds before pressing cancel. Ask Midtrans
      // first and refuse the cancellation if the money already arrived.
      const remote = await getMidtransStatus(payment.midtrans_order_id);
      const remoteStatus = mapMidtransStatus(remote.transaction_status, remote.fraud_status);
      if (remoteStatus === 'paid' || remoteStatus === 'challenge') {
        await applyPaymentStatus(payment, remote);
        return { ok: false, reason: remoteStatus };
      }
      if (!['expired', 'failed', 'refunded'].includes(remoteStatus)) {
        await expireMidtransTransaction(payment.midtrans_order_id).catch((err) => {
          console.warn('[midtrans] gagal menutup transaksi saat pembatalan:', err?.message || err);
        });
      }
    } catch (err) {
      // 404 means the Snap token was never opened, which is safe to close
      // locally. Other errors are logged but do not block the cancellation.
      if (!UNKNOWN_TRANSACTION.test(String(err?.message || err))) {
        console.warn('[midtrans] gagal cek status saat pembatalan:', err?.message || err);
      }
    }
  }

  await prisma.payments.updateMany({
    where: { id: payment.id, status: { in: ['pending', 'failed', 'expired'] } },
    data: { status: 'expired' },
  });
  return { ok: true };
}

/**
 * Admin action: refund a settled payment. Restores stock for orders that have
 * not shipped yet and cancels the linked orders.
 */
export async function refundPayment(paymentId, reason = null) {
  const payment = await prisma.payments.findUnique({
    where: { id: paymentId },
    include: paymentInclude,
  });
  if (!payment) throw new HttpError(404, 'Pembayaran tidak ditemukan.');
  if (!['paid', 'challenge'].includes(payment.status)) {
    throw new HttpError(400, 'Hanya pembayaran lunas atau yang sedang ditinjau yang bisa direfund.');
  }

  const midtrans = { attempted: false, error: null };
  if (payment.status === 'paid') {
    try {
      await refundMidtransTransaction(payment.midtrans_order_id, reason || 'Refund oleh admin');
      midtrans.attempted = true;
    } catch (err) {
      midtrans.error = err?.message || String(err);
      console.warn('[midtrans] refund gagal, status lokal tetap diubah:', midtrans.error);
    }
  }

  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.payments.updateMany({
      where: { id: payment.id, status: { in: ['paid', 'challenge'] } },
      data: { status: 'refunded' },
    });
    if (updated.count === 0) return { changed: false, cancelledOrderIds: [] };

    const cancelledOrderIds = [];
    for (const order of payment.orders) {
      if (order.status === 'cancelled') continue;
      // Goods that already shipped are not restocked, but the order is still
      // marked cancelled so the transaction trail stays consistent.
      const restock = ['pending_payment', 'processing'].includes(order.status);
      await tx.orders.update({ where: { id: order.id }, data: { status: 'cancelled' } });
      if (restock) {
        for (const item of order.items) {
          if (!item.product_id) continue;
          await tx.products.update({
            where: { id: item.product_id },
            data: { stock: { increment: item.quantity } },
          });
        }
      }
      await tx.order_status_history.create({
        data: {
          order_id: order.id,
          status: 'cancelled',
          from_status: order.status,
          to_status: 'cancelled',
          changed_by: null,
          note: `Refund pembayaran${reason ? `: ${reason}` : ''}`,
        },
      });
      cancelledOrderIds.push(order.id);
    }
    return { changed: true, cancelledOrderIds };
  });

  if (result.changed) {
    const firstOrder = payment.orders[0];
    const buyerId = firstOrder?.buyer_id || null;
    await notify(buyerId, {
      type: 'payment_refunded',
      title: 'Pembayaran dikembalikan',
      body: `Pembayaran untuk pesanan #${(firstOrder?.id || '').slice(0, 8)} telah direfund${reason ? ` (${reason})` : ''}.`,
      link: firstOrder ? `/pesanan/${firstOrder.id}` : '/profil/riwayat',
    });
    await Promise.all(
      collectOwnerIds(payment.orders).map((ownerId) =>
        notify(ownerId, {
          type: 'payment_refunded',
          title: 'Pesanan direfund',
          body: `Pembayaran pesanan #${(firstOrder?.id || '').slice(0, 8)} dikembalikan ke pembeli${reason ? ` (${reason})` : ''}.`,
          link: '/dashboard/toko/pesanan',
        }),
      ),
    );
  }

  return { ok: true, status: 'refunded', ...result, midtrans };
}

/**
 * Admin action: accept or deny a payment that Midtrans marked as `challenge`.
 * Accepting treats the money as settled; denying lets the buyer pay again.
 */
export async function resolvePaymentChallenge(paymentId, decision, reason = null) {
  if (!['accept', 'deny'].includes(decision)) {
    throw new HttpError(400, 'Keputusan harus "accept" atau "deny".');
  }

  const payment = await prisma.payments.findUnique({
    where: { id: paymentId },
    include: paymentInclude,
  });
  if (!payment) throw new HttpError(404, 'Pembayaran tidak ditemukan.');
  if (payment.status !== 'challenge') {
    throw new HttpError(400, 'Pembayaran ini tidak sedang ditinjau.');
  }

  const midtrans = { attempted: false, error: null };
  try {
    await approveOrDenyMidtransTransaction(payment.midtrans_order_id, decision);
    midtrans.attempted = true;
  } catch (err) {
    midtrans.error = err?.message || String(err);
    console.warn('[midtrans] gagal mengirim keputusan challenge:', midtrans.error);
  }

  const payload = {
    order_id: payment.midtrans_order_id,
    status_code: decision === 'accept' ? '200' : '202',
    gross_amount: `${payment.gross_amount}.00`,
    transaction_status: decision === 'accept' ? 'settlement' : 'deny',
    fraud_status: decision === 'accept' ? 'accept' : 'deny',
    transaction_id: payment.transaction_id || undefined,
    payment_type: payment.payment_type || undefined,
    admin_decision: decision,
    admin_note: reason || null,
  };

  const result = await applyPaymentStatus(payment, payload);
  return { ...result, decision, midtrans };
}

/**
 * Admin action: reconcile payments that never received a webhook and cancel
 * abandoned unpaid orders so their reserved stock is released.
 */
export async function reconcilePayments({ limit = 25 } = {}) {
  const now = new Date();
  const summary = {
    checked: 0,
    paid: 0,
    expired: 0,
    failed: 0,
    unchanged: 0,
    errors: 0,
    cancelledOrderIds: [],
  };

  const stalePayments = await prisma.payments.findMany({
    where: { status: 'pending', expires_at: { lte: now } },
    include: paymentInclude,
    orderBy: { expires_at: 'asc' },
    take: limit,
  });

  for (const payment of stalePayments) {
    summary.checked += 1;
    try {
      const remote = await getMidtransStatus(payment.midtrans_order_id);
      const result = await applyPaymentStatus(payment, remote);
      if (result.status === 'paid') summary.paid += 1;
      else if (result.status === 'expired') summary.expired += 1;
      else if (result.status === 'failed') summary.failed += 1;
      else summary.unchanged += 1;
    } catch (err) {
      if (UNKNOWN_TRANSACTION.test(String(err?.message || err))) {
        // Midtrans never saw this transaction (the Snap popup was never
        // opened), so there is nothing to wait for.
        const updated = await prisma.payments.updateMany({
          where: { id: payment.id, status: 'pending' },
          data: { status: 'expired' },
        });
        if (updated.count) summary.expired += 1;
        else summary.unchanged += 1;
      } else {
        summary.errors += 1;
        console.warn('[midtrans] gagal menyinkronkan pembayaran:', err?.message || err);
      }
    }
  }

  const cutoff = new Date(Date.now() - STALE_ORDER_HOURS * 60 * 60 * 1000);
  const staleOrders = await prisma.orders.findMany({
    where: {
      status: 'pending_payment',
      created_at: { lte: cutoff },
      OR: [
        { payment_id: null },
        { payment: { is: { status: { in: ['expired', 'failed'] } } } },
      ],
    },
    include: { items: true, payment: { select: { status: true } } },
    take: limit,
  });

  for (const order of staleOrders) {
    const cancelled = await prisma.$transaction(async (tx) => {
      const moved = await tx.orders.updateMany({
        where: { id: order.id, status: 'pending_payment' },
        data: { status: 'cancelled' },
      });
      if (moved.count === 0) return false;
      for (const item of order.items) {
        if (!item.product_id) continue;
        await tx.products.update({
          where: { id: item.product_id },
          data: { stock: { increment: item.quantity } },
        });
      }
      await tx.order_status_history.create({
        data: {
          order_id: order.id,
          status: 'cancelled',
          from_status: 'pending_payment',
          to_status: 'cancelled',
          changed_by: null,
          note: 'Dibatalkan otomatis karena pembayaran tidak diselesaikan',
        },
      });
      return true;
    });
    if (!cancelled) continue;
    summary.cancelledOrderIds.push(order.id);
    await notify(order.buyer_id, {
      type: 'order_cancelled',
      title: 'Pesanan dibatalkan otomatis',
      body: `Pesanan #${order.id.slice(0, 8)} dibatalkan karena pembayaran tidak diselesaikan. Stok sudah dikembalikan.`,
      link: `/pesanan/${order.id}`,
    });
  }

  return summary;
}
