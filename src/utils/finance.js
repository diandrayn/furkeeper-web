/**
 * Partner-facing side of "Kelola Keuangan" (§2.10) — read-only balance
 * snapshot + own withdrawals, plus submitting a new payout request.
 * Backed by supabase/withdrawal_balance_migration.sql (my_withdrawal_balance
 * RPC + insert balance trigger) and supabase/finance_migration.sql
 * (withdrawals table + RLS: owner or admin reads, owner may insert on
 * their own store).
 */
import { supabase } from '../lib/supabaseClient';

function mapBalanceRow(row) {
  return {
    storeId: row.store_id,
    storeName: row.store_name,
    storeKind: row.store_kind,
    grossProduk: Number(row.gross_produk || 0),
    grossJasa: Number(row.gross_jasa || 0),
    komisiProduk: Number(row.komisi_produk || 0),
    komisiJasa: Number(row.komisi_jasa || 0),
    withdrawn: Number(row.withdrawn || 0),
    available: Number(row.available || 0),
  };
}

/** Balance breakdown for every store owned by the signed-in user. */
export async function fetchMyWithdrawalBalance() {
  const { data, error } = await supabase.rpc('my_withdrawal_balance');
  if (error) throw error;
  return (data || []).map(mapBalanceRow);
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

/** This store's own payout history (owner RLS lets the owner read it). */
export async function fetchMyWithdrawals(storeId) {
  const { data, error } = await supabase
    .from('withdrawals')
    .select('*')
    .eq('store_id', storeId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(mapWithdrawalRow);
}

/** Submits a payout request; the DB trigger rejects amounts above the
 * store's available balance (see withdrawal_balance_migration.sql). */
export async function requestWithdrawal({ storeId, amount, bankName, accountNumber, accountHolder }) {
  const { data, error } = await supabase.from('withdrawals').insert({
    store_id: storeId,
    amount,
    bank_name: bankName,
    account_number: accountNumber,
    account_holder: accountHolder,
  }).select().single();
  if (error) throw error;
  return mapWithdrawalRow(data);
}