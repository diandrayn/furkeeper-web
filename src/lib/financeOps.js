import { prisma } from '@/lib/prisma';
import { HttpError } from '@/lib/http';

async function settings() {
  const row = await prisma.platform_settings.findUnique({ where: { id: 1 } });
  return {
    rateP: Number(row?.commission_produk_percent ?? 5),
    rateJ: Number(row?.commission_jasa_percent ?? 10),
  };
}

export async function storeAvailableBalance(storeId) {
  const { rateP, rateJ } = await settings();
  const [items, bookings, withdrawnAgg] = await Promise.all([
    prisma.order_items.findMany({
      where: { store_id: storeId, order: { status: 'completed' } },
      select: { price: true, quantity: true },
    }),
    prisma.bookings.findMany({
      where: { service: { store_id: storeId }, status: 'completed' },
      select: { price: true },
    }),
    prisma.withdrawals.aggregate({
      where: { store_id: storeId, status: { in: ['pending', 'processing', 'completed'] } },
      _sum: { amount: true },
    }),
  ]);
  const grossP = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const grossJ = bookings.reduce((sum, b) => sum + b.price, 0);
  const withdrawn = withdrawnAgg._sum.amount || 0;
  return Math.round(grossP * (1 - rateP / 100)) + Math.round(grossJ * (1 - rateJ / 100)) - withdrawn;
}

function mapBalance(store, grossP, grossJ, rateP, rateJ, withdrawn) {
  const komisiProduk = Math.round((grossP * rateP) / 100);
  const komisiJasa = Math.round((grossJ * rateJ) / 100);
  return {
    storeId: store.id,
    storeName: store.name,
    storeKind: store.kind,
    grossProduk: grossP,
    grossJasa: grossJ,
    komisiProduk,
    komisiJasa,
    withdrawn,
    available: grossP - komisiProduk + (grossJ - komisiJasa) - withdrawn,
  };
}

export async function fetchMyWithdrawalBalance(user) {
  const { rateP, rateJ } = await settings();
  const stores = await prisma.stores.findMany({ where: { owner_id: user.id } });
  const results = [];
  for (const store of stores) {
    const [items, bookings, withdrawnAgg] = await Promise.all([
      prisma.order_items.findMany({
        where: { store_id: store.id, order: { status: 'completed' } },
        select: { price: true, quantity: true },
      }),
      prisma.bookings.findMany({
        where: { service: { store_id: store.id }, status: 'completed' },
        select: { price: true },
      }),
      prisma.withdrawals.aggregate({
        where: { store_id: store.id, status: { in: ['pending', 'processing', 'completed'] } },
        _sum: { amount: true },
      }),
    ]);
    const grossP = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const grossJ = bookings.reduce((sum, b) => sum + b.price, 0);
    results.push(mapBalance(store, grossP, grossJ, rateP, rateJ, withdrawnAgg._sum.amount || 0));
  }
  return results;
}

function mapWithdrawalRow(row) {
  return {
    id: row.id,
    storeId: row.store_id,
    amount: Number(row.amount),
    bankName: row.bank_name,
    accountNumber: row.account_number,
    accountHolder: row.account_holder,
    status: row.status,
    adminNote: row.admin_note,
    createdAt: row.created_at,
    processedAt: row.processed_at,
  };
}

export async function fetchMyWithdrawals(user, storeId) {
  const store = await prisma.stores.findUnique({ where: { id: storeId } });
  if (!store) throw new HttpError(404, 'Toko tidak ditemukan.');
  if (store.owner_id !== user.id && user.role !== 'admin') throw new HttpError(403, 'Akses ditolak.');
  const rows = await prisma.withdrawals.findMany({
    where: { store_id: storeId },
    orderBy: { created_at: 'desc' },
  });
  return rows.map(mapWithdrawalRow);
}

export async function requestWithdrawal(user, payload) {
  const store = await prisma.stores.findUnique({ where: { id: payload.storeId } });
  if (!store) throw new HttpError(404, 'Toko tidak ditemukan.');
  if (store.owner_id !== user.id) throw new HttpError(403, 'Kamu bukan pemilik toko ini.');
  const available = await storeAvailableBalance(payload.storeId);
  if (Number(payload.amount) > available) {
    throw new HttpError(
      400,
      `Saldo tersedia tidak mencukupi. Maksimal pencairan Rp${available.toLocaleString('id-ID')} di toko ini.`,
    );
  }
  const row = await prisma.withdrawals.create({
    data: {
      store_id: payload.storeId,
      amount: Number(payload.amount),
      bank_name: payload.bankName,
      account_number: payload.accountNumber,
      account_holder: payload.accountHolder,
    },
  });
  return mapWithdrawalRow(row);
}
