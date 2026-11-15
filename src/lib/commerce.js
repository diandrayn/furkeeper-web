import { prisma } from '@/lib/prisma';
import { HttpError } from '@/lib/http';
import { notify } from '@/lib/notify';
import { mapBookingRow, mapOrderRow, mapProviderBooking, mapStoreOrder } from '@/lib/mappers';
import { getShippingFee } from '@/lib/shipping';

const orderInclude = {
  items: { include: { store: { select: { name: true } } } },
  payment: true,
};

export async function submitOrder(user, payload) {
  const items = payload.items || [];
  if (!items.length) throw new HttpError(400, 'Keranjang pesanan kosong.');
  if (!payload.addressId) throw new HttpError(400, 'Alamat pengiriman wajib dipilih.');

  const address = await prisma.addresses.findUnique({ where: { id: payload.addressId } });
  if (!address || address.user_id !== user.id) {
    throw new HttpError(400, 'Alamat pengiriman tidak ditemukan.');
  }

  const shippingAddress = `${address.recipient_name} — ${address.phone}\n${address.full_address}\n${[
    address.district,
    address.city,
    address.postal_code,
  ]
    .filter(Boolean)
    .join(', ')}`;
  const shippingCost = getShippingFee(address.district);

  const order = await prisma.$transaction(async (tx) => {
    // Never trust prices or totals from the client. Resolve every line from
    // the database so the amount sent to the payment gateway is authoritative.
    const lines = [];
    for (const item of items) {
      const qty = Math.max(1, Number(item.quantity) || 1);
      const productId = item.product_id || item.productId || null;
      if (!productId) throw new HttpError(400, 'Item pesanan tidak valid.');

      const product = await tx.products.findUnique({ where: { id: productId } });
      if (!product) throw new HttpError(400, 'Produk tidak ditemukan.');
      if (!product.is_active || product.approval_status !== 'approved') {
        throw new HttpError(400, `Produk "${product.name}" sedang tidak tersedia.`);
      }
      if (product.stock < qty) {
        throw new HttpError(400, `Stok "${product.name}" tidak cukup (tersisa ${product.stock}).`);
      }

      lines.push({ product, qty, variant: item.variant || null });
    }

    const subtotal = lines.reduce((sum, line) => sum + line.product.price * line.qty, 0);
    const total = subtotal + shippingCost;

    const created = await tx.orders.create({
      data: {
        buyer_id: user.id,
        address_id: address.id,
        payment_method: payload.paymentMethod || null,
        subtotal,
        shipping_cost: shippingCost,
        total,
        shipping_address: shippingAddress,
      },
    });

    for (const line of lines) {
      await tx.products.update({
        where: { id: line.product.id },
        data: { stock: { decrement: line.qty } },
      });
      await tx.order_items.create({
        data: {
          order_id: created.id,
          product_id: line.product.id,
          store_id: line.product.store_id,
          name: line.product.name,
          variant: line.variant,
          price: line.product.price,
          quantity: line.qty,
        },
      });
    }
    return created;
  });

  const ownerRows = await prisma.order_items.findMany({
    where: { order_id: order.id, store_id: { not: null } },
    include: { store: { select: { owner_id: true } } },
  });
  const ownerIds = [...new Set(ownerRows.map((r) => r.store?.owner_id).filter((id) => id && id !== user.id))];
  await Promise.all(
    ownerIds.map((ownerId) =>
      notify(ownerId, {
        type: 'new_order',
        title: `Pesanan baru #${order.id.slice(0, 8)}`,
        body: 'Ada pesanan baru menunggu konfirmasi dari kamu.',
        link: '/dashboard/toko/pesanan',
      }),
    ),
  );

  return order.id;
}

function canBuyerChangeOrder(from, to) {
  return (from === 'pending_payment' && to === 'cancelled') || (from === 'shipped' && to === 'completed');
}

function canSellerChangeOrder(from, to) {
  return (
    (from === 'pending_payment' && ['processing', 'cancelled'].includes(to)) ||
    (from === 'processing' && ['shipped', 'cancelled'].includes(to)) ||
    (from === 'shipped' && ['completed', 'cancelled'].includes(to))
  );
}

export async function setOrderStatus(user, orderId, status, actor) {
  if (!['buyer', 'seller'].includes(actor)) throw new HttpError(400, 'Aktor tidak valid.');

  await prisma.$transaction(async (tx) => {
    const order = await tx.orders.findUnique({
      where: { id: orderId },
      include: { items: { include: { store: true } } },
    });
    if (!order) throw new HttpError(404, 'Pesanan tidak ditemukan.');

    if (actor === 'buyer') {
      if (order.buyer_id !== user.id) throw new HttpError(403, 'Pesanan ini bukan milikmu.');
      if (!canBuyerChangeOrder(order.status, status)) {
        throw new HttpError(400, `Pembeli tidak dapat mengubah status dari "${order.status}" ke "${status}".`);
      }
    } else {
      const owns = order.items.some((item) => item.store?.owner_id === user.id);
      if (!owns && user.role !== 'admin') throw new HttpError(403, 'Kamu bukan penjual dari pesanan ini.');
      if (!canSellerChangeOrder(order.status, status)) {
        throw new HttpError(400, `Transisi status "${order.status}" ke "${status}" tidak diizinkan.`);
      }
    }

    await tx.orders.update({ where: { id: orderId }, data: { status } });
    await tx.order_status_history.create({
      data: {
        order_id: orderId,
        status,
        from_status: order.status,
        to_status: status,
        changed_by: user.id,
      },
    });

    if (status === 'cancelled') {
      for (const item of order.items) {
        if (item.product_id) {
          await tx.products.update({
            where: { id: item.product_id },
            data: { stock: { increment: item.quantity } },
          });
        }
      }
    }
  });

  const order = await prisma.orders.findUnique({
    where: { id: orderId },
    include: { items: { include: { store: true } } },
  });
  if (actor === 'seller') {
    await notify(order.buyer_id, {
      type: 'order_status',
      title: `Pesanan #${orderId.slice(0, 8)}`,
      body: `Status pesananmu menjadi "${status}".`,
      link: `/pesanan/${orderId}`,
    });
  } else {
    const ownerIds = [...new Set(order.items.map((i) => i.store?.owner_id).filter(Boolean))];
    await Promise.all(
      ownerIds.map((ownerId) =>
        notify(ownerId, {
          type: 'order_status',
          title: `Pesanan #${orderId.slice(0, 8)}`,
          body: `Pembeli mengubah pesanan menjadi "${status}".`,
          link: '/dashboard/toko/pesanan',
        }),
      ),
    );
  }
}

export async function fetchMyOrders(buyerId) {
  const rows = await prisma.orders.findMany({
    where: { buyer_id: buyerId },
    include: orderInclude,
    orderBy: { created_at: 'desc' },
  });
  return rows.map(mapOrderRow);
}

export async function fetchOrderById(user, orderId) {
  const row = await prisma.orders.findUnique({
    where: { id: orderId },
    include: { ...orderInclude, items: { include: { store: true } } },
  });
  if (!row) return null;
  const isBuyer = row.buyer_id === user.id;
  const isSeller = row.items.some((item) => item.store?.owner_id === user.id);
  if (!isBuyer && !isSeller && user.role !== 'admin') throw new HttpError(403, 'Akses ditolak.');
  return mapOrderRow(row);
}

export async function fetchOrdersByIds(buyerId, ids) {
  if (!ids?.length) return [];
  const rows = await prisma.orders.findMany({
    where: { buyer_id: buyerId, id: { in: ids } },
    include: orderInclude,
    orderBy: { created_at: 'desc' },
  });
  return rows.map(mapOrderRow);
}

export async function fetchOrderHistory(user, orderId) {
  const order = await prisma.orders.findUnique({
    where: { id: orderId },
    include: { items: { include: { store: true } } },
  });
  if (!order) throw new HttpError(404, 'Pesanan tidak ditemukan.');
  const isBuyer = order.buyer_id === user.id;
  const isSeller = order.items.some((item) => item.store?.owner_id === user.id);
  if (!isBuyer && !isSeller && user.role !== 'admin') throw new HttpError(403, 'Akses ditolak.');
  const rows = await prisma.order_status_history.findMany({
    where: { order_id: orderId },
    orderBy: { created_at: 'asc' },
  });
  return rows.map((row) => ({
    id: row.id,
    fromStatus: row.from_status,
    toStatus: row.to_status,
    changedBy: row.changed_by,
    createdAt: new Date(row.created_at).getTime(),
  }));
}

export async function fetchStoreOrders(user, storeId) {
  const store = await prisma.stores.findUnique({ where: { id: storeId } });
  if (!store) throw new HttpError(404, 'Toko tidak ditemukan.');
  if (store.owner_id !== user.id && user.role !== 'admin') {
    throw new HttpError(403, 'Kamu bukan pemilik toko ini.');
  }
  const rows = await prisma.orders.findMany({
    where: { items: { some: { store_id: storeId } } },
    include: {
      items: true,
      payment: true,
      profile: { select: { full_name: true, phone: true } },
    },
    orderBy: { created_at: 'desc' },
  });
  return rows.map(mapStoreOrder);
}

export async function submitBooking(user, payload) {
  const dateValue = payload.date instanceof Date
    ? payload.date
    : new Date(`${String(payload.date || '').slice(0, 10)}T00:00:00`);
  if (Number.isNaN(dateValue.getTime())) throw new HttpError(400, 'Tanggal booking tidak valid.');

  const service = await prisma.services.findUnique({
    where: { id: payload.serviceId },
    include: { store: true },
  });
  if (!service) throw new HttpError(404, 'Jasa tidak ditemukan.');

  const pet = payload.petId ? await prisma.pets.findUnique({ where: { id: payload.petId } }) : null;

  const booking = await prisma.bookings.create({
    data: {
      buyer_id: user.id,
      service_id: payload.serviceId,
      service_package_id: payload.packageId || null,
      pet_id: payload.petId || null,
      scheduled_date: dateValue,
      scheduled_time: String(payload.time || ''),
      price: Math.max(0, Number(payload.price) || 0),
      notes: payload.notes || null,
      buyer_name: user.full_name || '',
      buyer_phone: user.phone || '',
      pet_name: pet?.name || '',
      pet_species: pet?.species || '',
    },
  });

  if (service.store.owner_id !== user.id) {
    await notify(service.store.owner_id, {
      type: 'new_booking',
      title: `Booking baru #${booking.id.slice(0, 8)}`,
      body: 'Ada booking baru menunggu konfirmasi darimu.',
      link: '/dashboard/jasa/booking',
    });
  }
  return booking.id;
}

function canBuyerChangeBooking(from, to) {
  return (
    (from === 'pending_confirmation' && to === 'cancelled') ||
    (from === 'confirmed' && to === 'cancelled') ||
    (from === 'in_progress' && to === 'completed')
  );
}

function canProviderChangeBooking(from, to) {
  return (
    (from === 'pending_confirmation' && ['confirmed', 'cancelled'].includes(to)) ||
    (from === 'confirmed' && ['in_progress', 'cancelled'].includes(to)) ||
    (from === 'in_progress' && ['completed', 'cancelled'].includes(to))
  );
}

export async function setBookingStatus(user, bookingId, status, actor) {
  if (!['buyer', 'provider'].includes(actor)) throw new HttpError(400, 'Aktor tidak valid.');

  const booking = await prisma.bookings.findUnique({
    where: { id: bookingId },
    include: { service: { include: { store: true } } },
  });
  if (!booking) throw new HttpError(404, 'Booking tidak ditemukan.');
  const providerId = booking.service.store.owner_id;

  if (actor === 'buyer') {
    if (booking.buyer_id !== user.id) throw new HttpError(403, 'Booking ini bukan milikmu.');
    if (!canBuyerChangeBooking(booking.status, status)) {
      throw new HttpError(400, `Pembeli tidak dapat mengubah status dari "${booking.status}" ke "${status}".`);
    }
  } else {
    if (providerId !== user.id && user.role !== 'admin') {
      throw new HttpError(403, 'Kamu bukan penyedia jasa untuk booking ini.');
    }
    if (!canProviderChangeBooking(booking.status, status)) {
      throw new HttpError(400, `Transisi status "${booking.status}" ke "${status}" tidak diizinkan.`);
    }
  }

  await prisma.$transaction([
    prisma.bookings.update({ where: { id: bookingId }, data: { status } }),
    prisma.booking_status_history.create({
      data: {
        booking_id: bookingId,
        status,
        from_status: booking.status,
        to_status: status,
        changed_by: user.id,
      },
    }),
  ]);

  if (actor === 'provider') {
    await notify(booking.buyer_id, {
      type: 'booking_status',
      title: `Booking #${bookingId.slice(0, 8)}`,
      body: `Status bookingmu menjadi "${status}".`,
      link: `/booking/${bookingId}`,
    });
  } else if (providerId) {
    await notify(providerId, {
      type: 'booking_status',
      title: `Booking #${bookingId.slice(0, 8)}`,
      body: `Pembeli mengubah booking menjadi "${status}".`,
      link: '/dashboard/jasa/booking',
    });
  }
}

const bookingInclude = {
  service: { include: { store: { select: { name: true, id: true } } } },
  package: true,
  pet: true,
};

export async function fetchMyBookings(buyerId) {
  const rows = await prisma.bookings.findMany({
    where: { buyer_id: buyerId },
    include: bookingInclude,
    orderBy: { created_at: 'desc' },
  });
  return rows.map(mapBookingRow);
}

export async function fetchBookingById(user, bookingId) {
  const row = await prisma.bookings.findUnique({
    where: { id: bookingId },
    include: { ...bookingInclude, service: { include: { store: true } } },
  });
  if (!row) return null;
  const isBuyer = row.buyer_id === user.id;
  const isProvider = row.service?.store?.owner_id === user.id;
  if (!isBuyer && !isProvider && user.role !== 'admin') throw new HttpError(403, 'Akses ditolak.');
  return mapBookingRow(row);
}

export async function fetchBookingHistory(user, bookingId) {
  const booking = await prisma.bookings.findUnique({
    where: { id: bookingId },
    include: { service: { include: { store: true } } },
  });
  if (!booking) throw new HttpError(404, 'Booking tidak ditemukan.');
  const isBuyer = booking.buyer_id === user.id;
  const isProvider = booking.service?.store?.owner_id === user.id;
  if (!isBuyer && !isProvider && user.role !== 'admin') throw new HttpError(403, 'Akses ditolak.');
  const rows = await prisma.booking_status_history.findMany({
    where: { booking_id: bookingId },
    orderBy: { created_at: 'asc' },
  });
  return rows.map((row) => ({
    id: row.id,
    fromStatus: row.from_status,
    toStatus: row.to_status,
    changedBy: row.changed_by,
    createdAt: new Date(row.created_at).getTime(),
  }));
}

export async function fetchProviderBookings(user, storeId) {
  const store = await prisma.stores.findUnique({ where: { id: storeId } });
  if (!store) throw new HttpError(404, 'Toko tidak ditemukan.');
  if (store.owner_id !== user.id && user.role !== 'admin') {
    throw new HttpError(403, 'Kamu bukan pemilik toko ini.');
  }
  const rows = await prisma.bookings.findMany({
    where: { service: { store_id: storeId } },
    include: {
      buyer: { select: { full_name: true, phone: true } },
      service: { select: { name: true, store_id: true } },
    },
    orderBy: { created_at: 'desc' },
  });
  return rows.map(mapProviderBooking);
}
