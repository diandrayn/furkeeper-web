import { useCallback, useEffect, useMemo, useState } from 'react';
import { Wallet, TrendingUp, Percent, Landmark, History } from 'lucide-react';
import Card from '../../components/Card';
import Input from '../../components/Input';
import Button from '../../components/Button';
import StatCard from '../../components/dashboard/StatCard';
import PawLoader from '../../components/decorative/PawLoader';
import { useDashboard } from '../../hooks/useDashboard';
import {
  fetchMyWithdrawalBalance,
  fetchMyWithdrawals,
  requestWithdrawal,
} from '../../utils/finance';
import { formatDateId } from '../../utils/status';
import { useLanguage } from '../../i18n/LanguageContext';

function formatRupiah(value) {
  return `Rp${Number(value || 0).toLocaleString('id-ID')}`;
}

const STATUS_LABELS = {
  pending: 'Menunggu',
  processing: 'Diproses',
  completed: 'Selesai',
  rejected: 'Ditolak',
};

function statusBadgeClass(status) {
  switch (status) {
    case 'pending':
    case 'processing':
      return 'bg-status-warning/25 text-[#8a6d1f]';
    case 'completed':
      return 'bg-status-success/20 text-status-success';
    case 'rejected':
      return 'bg-status-danger/15 text-status-danger';
    default:
      return 'bg-gray-100 text-text-secondary';
  }
}

export default function DashboardWithdrawalsPage({ mode }) {
  const { t } = useLanguage();
  const { storeId, serviceStoreId } = useDashboard();
  const myStoreId = mode === 'jasa' ? serviceStoreId : storeId;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [balance, setBalance] = useState(null);
  const [history, setHistory] = useState([]);

  const [form, setForm] = useState({ amount: '', bankName: '', accountNumber: '', accountHolder: '' });
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Reusable fetcher: balance breakdown + this store's withdrawal history.
  const fetchFresh = useCallback(() => {
    if (!myStoreId) return Promise.resolve([]);
    return Promise.all([fetchMyWithdrawalBalance(), fetchMyWithdrawals(myStoreId)]);
  }, [myStoreId]);

  useEffect(() => {
    if (!myStoreId) return undefined;
    let active = true;
    fetchFresh()
      .then(([balances, rows]) => {
        if (!active) return;
        setBalance(balances.find((b) => b.storeId === myStoreId) || null);
        setHistory(rows);
        setError(null);
      })
      .catch((err) => {
        if (!active) return;
        console.error('Withdrawals load failed:', err);
        setError(err.message || 'Gagal memuat data pencairan.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [fetchFresh, myStoreId]);

  const available = useMemo(() => balance?.available || 0, [balance]);
  const grossEarnings = useMemo(() => (balance?.grossProduk || 0) + (balance?.grossJasa || 0), [balance]);
  const totalCommission = useMemo(() => (balance?.komisiProduk || 0) + (balance?.komisiJasa || 0), [balance]);

  const setField = (key) => (event) => {
    setForm((prev) => ({ ...prev, [key]: event.target.value }));
    setFormError(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSuccess(false);

    const amount = Number(form.amount);
    if (!form.amount || Number.isNaN(amount) || amount <= 0) {
      setFormError(t('withdrawals.errors.amountInvalid'));
      return;
    }
    if (amount > available) {
      setFormError(t('withdrawals.errors.amountExceeds'));
      return;
    }
    if (!form.bankName.trim() || !form.accountNumber.trim() || !form.accountHolder.trim()) {
      setFormError(t('withdrawals.errors.banksRequired'));
      return;
    }

    setSubmitting(true);
    setFormError(null);
    try {
      await requestWithdrawal({
        storeId: myStoreId,
        amount,
        bankName: form.bankName.trim(),
        accountNumber: form.accountNumber.trim(),
        accountHolder: form.accountHolder.trim(),
      });
      setForm({ amount: '', bankName: '', accountNumber: '', accountHolder: '' });
      setSuccess(true);
      fetchFresh().then(([balances, rows]) => {
        setBalance(balances.find((b) => b.storeId === myStoreId) || null);
        setHistory(rows);
      });
    } catch (err) {
      console.error('Withdrawal request failed:', err);
      setFormError(err.message || t('withdrawals.error'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="!flex flex-col gap-4 sm:!flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="font-heading text-xl font-bold text-text-primary">{t('withdrawals.title')}</h2>
          <p className="mt-1 text-sm text-text-secondary">{t('withdrawals.subtitle')}</p>
        </div>
        <span className="flex items-center gap-1.5 rounded-full bg-brand-burgundy/10 px-3 py-1 text-xs font-semibold text-brand-burgundy">
          <Landmark className="h-3.5 w-3.5" aria-hidden="true" />
          {balance?.storeName || '—'}
        </span>
      </Card>

      {loading ? (
        <PawLoader />
      ) : error ? (
        <Card>
          <p className="text-sm text-status-danger" role="alert">{error}</p>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              icon={Wallet}
              label={t('withdrawals.available')}
              value={formatRupiah(available)}
              hint={t('withdrawals.maxHint').replace('{value}', formatRupiah(available))}
              tone="success"
            />
            <StatCard
              icon={TrendingUp}
              label={t('withdrawals.gross')}
              value={formatRupiah(grossEarnings)}
              hint={t('withdrawals.grossHint')}
              tone="burgundy"
            />
            <StatCard
              icon={Percent}
              label={t('withdrawals.commission')}
              value={formatRupiah(totalCommission)}
              hint={t('withdrawals.commissionHint')}
              tone="warning"
            />
            <StatCard
              icon={History}
              label={t('withdrawals.withdrawn')}
              value={formatRupiah(balance?.withdrawn || 0)}
              hint={t('withdrawals.withdrawnHint')}
              tone="orange"
            />
          </div>

          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
            <Card>
              <h3 className="font-heading text-base font-bold text-text-primary">{t('withdrawals.requestTitle')}</h3>
              <form onSubmit={handleSubmit} className="mt-4 space-y-3">
                <Input
                  label={t('withdrawals.amount')}
                  type="number"
                  min="1000"
                  step="1000"
                  required
                  value={form.amount}
                  onChange={setField('amount')}
                  placeholder="Contoh: 250000"
                />
                <Input
                  label={t('withdrawals.bankName')}
                  required
                  value={form.bankName}
                  onChange={setField('bankName')}
                  placeholder="BCA/Mandiri/BRI…"
                />
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Input
                    label={t('withdrawals.accountNumber')}
                    required
                    value={form.accountNumber}
                    onChange={setField('accountNumber')}
                    placeholder="Nomor rekening"
                  />
                  <Input
                    label={t('withdrawals.accountHolder')}
                    required
                    value={form.accountHolder}
                    onChange={setField('accountHolder')}
                    placeholder="Atas nama pemilik rekening"
                  />
                </div>

                {formError && (
                  <p className="text-xs text-status-danger" role="alert">{formError}</p>
                )}
                {success && (
                  <p className="text-xs font-medium text-status-success" role="status">
                    {t('withdrawals.success')}
                  </p>
                )}

                <Button type="submit" variant="primary" className="w-full" loading={submitting}>
                  {t('withdrawals.submit')}
                </Button>
                <p className="text-center text-xs text-text-secondary">
                  {t('withdrawals.pendingHint')}
                </p>
              </form>
            </Card>

            <Card>
              <div className="flex items-center justify-between">
                <h3 className="font-heading text-base font-bold text-text-primary">{t('withdrawals.historyTitle')}</h3>
                <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-text-secondary">
                  {history.length}
                </span>
              </div>

              {history.length === 0 ? (
                <div className="mt-6 py-10 text-center">
                  <History className="mx-auto h-10 w-10 text-gray-300" aria-hidden="true" />
                  <p className="mt-3 text-sm font-medium text-text-secondary">{t('withdrawals.empty')}</p>
                  <p className="mt-1 text-xs text-text-secondary">{t('withdrawals.emptyHint')}</p>
                </div>
              ) : (
                <ul className="mt-4 divide-y divide-gray-100">
                  {history.map((entry) => (
                    <li key={entry.id} className="py-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-text-primary">{formatRupiah(entry.amount)}</p>
                          <p className="mt-0.5 text-xs text-text-secondary">
                            {entry.bankName} • {entry.accountNumber} a.n. {entry.accountHolder}
                          </p>
                          <p className="mt-1 text-xs text-text-secondary">
                            {t('withdrawals.requestedAt').replace('{value}', formatDateId(entry.createdAt))}
                          </p>
                          {entry.status === 'rejected' && entry.adminNote && (
                            <p className="mt-1 text-xs text-status-danger">
                              {t('withdrawals.rejectedReason').replace('{value}', entry.adminNote)}
                            </p>
                          )}
                        </div>
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusBadgeClass(entry.status)}`}>
                          {STATUS_LABELS[entry.status] || entry.status}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        </>
      )}
    </div>
  );
}