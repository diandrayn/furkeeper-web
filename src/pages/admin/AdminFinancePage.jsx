import { useEffect, useMemo, useState } from 'react';
import { Package, Scissors, Wallet, Landmark } from 'lucide-react';
import Card from '../../components/Card';
import Input from '../../components/Input';
import Select from '../../components/Select';
import Button from '../../components/Button';
import Pagination from '../../components/Pagination';
import EmptyState from '../../components/EmptyState';
import StatCard from '../../components/dashboard/StatCard';
import WithdrawalDialog from '../../components/admin/WithdrawalDialog';
import PawLoader from '../../components/decorative/PawLoader';
import {
  fetchPlatformSettings,
  updateCommissionRates,
  fetchCommissionRecap,
  fetchAllWithdrawals,
  setWithdrawalStatus,
  WITHDRAWAL_STATUS_LABELS,
} from '../../utils/admin';
import { formatDateId } from '../../utils/status';

const PAGE_SIZE = 6;

const formatRupiah = (value) => `Rp${Number(value || 0).toLocaleString('id-ID')}`;

const RANGE_OPTIONS = [
  { value: 'all', label: 'Semua waktu' },
  { value: '30d', label: '30 hari terakhir' },
  { value: 'month', label: 'Bulan ini' },
  { value: 'custom', label: 'Pilih tanggal' },
];

const WITHDRAWAL_TABS = [{ key: 'all', label: 'Semua' }, ...Object.entries(WITHDRAWAL_STATUS_LABELS).map(([key, label]) => ({ key, label }))];

function withdrawalBadgeClass(status) {
  if (status === 'pending') return 'bg-status-warning/30 text-text-primary';
  if (status === 'processing') return 'bg-brand-peach text-brand-burgundy';
  if (status === 'completed') return 'bg-status-success/20 text-status-success';
  if (status === 'rejected') return 'bg-status-danger/15 text-status-danger';
  return 'bg-gray-100 text-text-secondary';
}

/** Persen 0–100 dengan maksimal 2 desimal (sesuai numeric(5,2) di database). */
function parsePercent(text) {
  if (text === '' || text == null) return null;
  const value = Number(text);
  if (!Number.isFinite(value) || value < 0 || value > 100) return null;
  return Math.round(value * 100) / 100;
}

function rangeToIso(preset, customFrom, customTo) {
  const now = new Date();
  if (preset === '30d') {
    const from = new Date(now);
    from.setDate(from.getDate() - 30);
    return { from: from.toISOString(), to: null, invalid: false };
  }
  if (preset === 'month') {
    return { from: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(), to: null, invalid: false };
  }
  if (preset === 'custom') {
    if (!customFrom || !customTo || customFrom > customTo) return { from: null, to: null, invalid: true };
    return {
      from: new Date(`${customFrom}T00:00:00`).toISOString(),
      to: new Date(`${customTo}T23:59:59.999`).toISOString(),
      invalid: false,
    };
  }
  return { from: null, to: null, invalid: false };
}

function MigrationHint({ children }) {
  return (
    <Card>
      <p className="text-sm text-status-danger">
        {children} Pastikan migrasi{' '}
        <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs">supabase/finance_migration.sql</code> sudah dijalankan.
      </p>
    </Card>
  );
}

export default function AdminFinancePage() {
  // ---- Komisi platform ---------------------------------------------------
  const [savedRates, setSavedRates] = useState(null); // { produk, jasa } number
  const [rateForm, setRateForm] = useState({ produk: '', jasa: '' });
  const [ratesLoading, setRatesLoading] = useState(true);
  const [ratesError, setRatesError] = useState(null);
  const [ratesSaving, setRatesSaving] = useState(false);
  const [ratesSavedAt, setRatesSavedAt] = useState(null);
  const [ratesVersion, setRatesVersion] = useState(0); // bump -> recap dihitung ulang

  useEffect(() => {
    let active = true;
    fetchPlatformSettings()
      .then((s) => {
        if (!active) return;
        setSavedRates({ produk: s.commissionProdukPercent, jasa: s.commissionJasaPercent });
        setRateForm({ produk: String(s.commissionProdukPercent), jasa: String(s.commissionJasaPercent) });
      })
      .catch((err) => {
        console.error('fetchPlatformSettings failed:', err);
        if (active) setRatesError(err);
      })
      .finally(() => active && setRatesLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const parsedProduk = parsePercent(rateForm.produk);
  const parsedJasa = parsePercent(rateForm.jasa);
  const ratesValid = parsedProduk !== null && parsedJasa !== null;
  const ratesDirty = savedRates && ratesValid && (parsedProduk !== savedRates.produk || parsedJasa !== savedRates.jasa);

  const updateRateField = (field) => (e) => {
    setRateForm((prev) => ({ ...prev, [field]: e.target.value }));
    setRatesSavedAt(null);
  };

  const handleSaveRates = async () => {
    if (!ratesValid || !ratesDirty) return;
    setRatesSaving(true);
    try {
      await updateCommissionRates(parsedProduk, parsedJasa);
      setSavedRates({ produk: parsedProduk, jasa: parsedJasa });
      setRatesSavedAt(new Date());
      setRatesVersion((v) => v + 1);
    } catch (err) {
      console.error('updateCommissionRates failed:', err);
      window.alert('Gagal menyimpan rate komisi. Coba lagi.');
    } finally {
      setRatesSaving(false);
    }
  };

  // ---- Rekap komisi ------------------------------------------------------
  const [rangePreset, setRangePreset] = useState('all');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [recap, setRecap] = useState(null);
  const [recapLoading, setRecapLoading] = useState(true);
  const [recapError, setRecapError] = useState(null);

  const range = useMemo(() => rangeToIso(rangePreset, customFrom, customTo), [rangePreset, customFrom, customTo]);

  useEffect(() => {
    if (range.invalid) {
      setRecapLoading(false);
      return undefined;
    }
    let active = true;
    setRecapLoading(true);
    setRecapError(null);
    fetchCommissionRecap({ from: range.from, to: range.to })
      .then((r) => active && setRecap(r))
      .catch((err) => {
        console.error('fetchCommissionRecap failed:', err);
        if (active) setRecapError(err);
      })
      .finally(() => active && setRecapLoading(false));
    return () => {
      active = false;
    };
  }, [range, ratesVersion]);

  // ---- Pencairan dana ----------------------------------------------------
  const [withdrawals, setWithdrawals] = useState([]);
  const [wLoading, setWLoading] = useState(true);
  const [wError, setWError] = useState(null);
  const [wTab, setWTab] = useState('all');
  const [wPage, setWPage] = useState(1);
  const [busyId, setBusyId] = useState(null);
  const [dialogTarget, setDialogTarget] = useState(null); // { decision, withdrawal }

  const loadWithdrawals = () => {
    setWLoading(true);
    fetchAllWithdrawals({ status: 'all' })
      .then((rows) => {
        setWithdrawals(rows);
        setWError(null);
      })
      .catch((err) => {
        console.error('fetchAllWithdrawals failed:', err);
        setWError(err);
      })
      .finally(() => setWLoading(false));
  };

  useEffect(loadWithdrawals, []);
  useEffect(() => setWPage(1), [wTab]);

  const counts = useMemo(() => {
    const result = { all: withdrawals.length };
    withdrawals.forEach((w) => {
      result[w.status] = (result[w.status] || 0) + 1;
    });
    return result;
  }, [withdrawals]);

  const filtered = useMemo(() => (wTab === 'all' ? withdrawals : withdrawals.filter((w) => w.status === wTab)), [withdrawals, wTab]);
  const pageItems = useMemo(() => filtered.slice((wPage - 1) * PAGE_SIZE, wPage * PAGE_SIZE), [filtered, wPage]);

  const withdrawalLabel = (w) => `${w.storeName} — ${formatRupiah(w.amount)}`;

  const handleProcess = async (w) => {
    setBusyId(w.id);
    try {
      await setWithdrawalStatus(w.id, 'processing', null, withdrawalLabel(w));
      loadWithdrawals();
    } catch (err) {
      console.error('setWithdrawalStatus failed:', err);
      window.alert('Gagal mengubah status pencairan.');
    } finally {
      setBusyId(null);
    }
  };

  const handleDialogConfirm = async (note) => {
    if (!dialogTarget) return;
    const { decision, withdrawal } = dialogTarget;
    setBusyId(withdrawal.id);
    try {
      await setWithdrawalStatus(withdrawal.id, decision, note || null, withdrawalLabel(withdrawal));
      setDialogTarget(null);
      loadWithdrawals();
    } catch (err) {
      console.error('setWithdrawalStatus failed:', err);
      window.alert(err?.message?.startsWith('Pencairan') || err?.message?.startsWith('Alasan') ? err.message : 'Gagal mengubah status pencairan.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* ------------------------------------------------ Komisi platform */}
      <section className="space-y-3">
        <div>
          <h2 className="font-heading text-base font-bold text-text-primary">Komisi Platform</h2>
          <p className="text-sm text-text-secondary">Persentase yang diambil platform dari setiap transaksi produk dan booking jasa yang selesai.</p>
        </div>

        {ratesLoading && <PawLoader label="Memuat rate komisi..." />}
        {!ratesLoading && ratesError && <MigrationHint>Gagal memuat rate komisi.</MigrationHint>}

        {!ratesLoading && !ratesError && (
          <Card>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Komisi produk (%)"
                type="number"
                inputMode="decimal"
                min="0"
                max="100"
                step="0.5"
                value={rateForm.produk}
                onChange={updateRateField('produk')}
                error={rateForm.produk !== '' && parsedProduk === null ? 'Isi angka 0 sampai 100' : undefined}
              />
              <Input
                label="Komisi jasa (%)"
                type="number"
                inputMode="decimal"
                min="0"
                max="100"
                step="0.5"
                value={rateForm.jasa}
                onChange={updateRateField('jasa')}
                error={rateForm.jasa !== '' && parsedJasa === null ? 'Isi angka 0 sampai 100' : undefined}
              />
            </div>
            {(rateForm.produk === '' || rateForm.jasa === '') && (
              <p className="mt-2 text-xs text-status-danger">Kedua rate wajib diisi.</p>
            )}
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Button variant="primary" onClick={handleSaveRates} loading={ratesSaving} disabled={!ratesDirty} playful={false}>
                Simpan rate
              </Button>
              {ratesSavedAt && <span className="text-xs font-medium text-status-success">Tersimpan. Rekap di bawah sudah dihitung ulang.</span>}
              {!ratesSavedAt && !ratesDirty && savedRates && <span className="text-xs text-text-secondary">Belum ada perubahan.</span>}
            </div>
          </Card>
        )}
      </section>

      {/* ------------------------------------------------- Rekap komisi */}
      <section className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-heading text-base font-bold text-text-primary">Rekap Komisi</h2>
            <p className="text-sm text-text-secondary">Dari pesanan dan booking berstatus selesai pada periode yang dipilih.</p>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <Select className="sm:w-48" value={rangePreset} onChange={(e) => setRangePreset(e.target.value)} options={RANGE_OPTIONS} />
            {rangePreset === 'custom' && (
              <>
                <Input label="Dari" type="date" value={customFrom} max={customTo || undefined} onChange={(e) => setCustomFrom(e.target.value)} />
                <Input label="Sampai" type="date" value={customTo} min={customFrom || undefined} onChange={(e) => setCustomTo(e.target.value)} />
              </>
            )}
          </div>
        </div>

        {range.invalid && (
          <Card>
            <p className="text-sm text-text-secondary">Pilih tanggal awal dan akhir (tanggal awal tidak boleh setelah tanggal akhir) untuk melihat rekap.</p>
          </Card>
        )}

        {!range.invalid && recapLoading && <PawLoader label="Menghitung rekap..." />}
        {!range.invalid && !recapLoading && recapError && <MigrationHint>Gagal menghitung rekap komisi.</MigrationHint>}

        {!range.invalid && !recapLoading && !recapError && recap && (
          <>
            <div className="grid gap-4 sm:grid-cols-3">
              <StatCard
                icon={Wallet}
                label="Total komisi platform"
                value={formatRupiah(recap.totalCommission)}
                hint={`${recap.orderCount} pesanan + ${recap.bookingCount} booking selesai`}
                tone="orange"
              />
              <StatCard
                icon={Package}
                label={`Komisi produk (${recap.produkRate}%)`}
                value={formatRupiah(recap.commissionProduk)}
                hint={`dari penjualan ${formatRupiah(recap.grossProduk)}`}
                tone="burgundy"
              />
              <StatCard
                icon={Scissors}
                label={`Komisi jasa (${recap.jasaRate}%)`}
                value={formatRupiah(recap.commissionJasa)}
                hint={`dari booking ${formatRupiah(recap.grossJasa)}`}
                tone="success"
              />
            </div>
            <p className="text-xs text-text-secondary">
              Angka dihitung dari rate saat ini, bukan dari rate yang berlaku saat transaksi terjadi. Jika rate diubah, rekap periode lama ikut berubah.
            </p>
          </>
        )}
      </section>

      {/* ------------------------------------------------ Pencairan dana */}
      <section className="space-y-3">
        <div>
          <h2 className="font-heading text-base font-bold text-text-primary">Pencairan Dana</h2>
          <p className="text-sm text-text-secondary">
            Permintaan penarikan dari penjual dan penyedia jasa. Saldo belum tercatat di sistem, jadi cek jumlahnya secara manual sebelum memproses.
          </p>
        </div>

        <div className="flex flex-wrap gap-1 rounded-2xl bg-white p-1 shadow-sm sm:inline-flex sm:rounded-full">
          {WITHDRAWAL_TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setWTab(t.key)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors duration-150 ${
                wTab === t.key ? 'bg-brand-burgundy text-white' : 'text-text-secondary hover:text-brand-burgundy'
              }`}
            >
              {t.label}
              <span className={`ml-1.5 text-xs font-medium ${wTab === t.key ? 'text-white/75' : 'text-text-secondary'}`}>{counts[t.key] || 0}</span>
            </button>
          ))}
        </div>

        {wLoading && <PawLoader label="Memuat pencairan dana..." />}
        {!wLoading && wError && <MigrationHint>Gagal memuat pencairan dana.</MigrationHint>}

        {!wLoading && !wError && filtered.length === 0 && (
          <EmptyState
            title={wTab === 'all' ? 'Belum ada permintaan pencairan' : 'Tidak ada pencairan dengan status ini'}
            subtitle={wTab === 'all' ? 'Permintaan dari penjual dan penyedia jasa akan muncul di sini.' : 'Coba pilih status lain.'}
          />
        )}

        {!wLoading && !wError && filtered.length > 0 && (
          <>
            <Card className="!p-0 overflow-hidden">
              <div className="divide-y divide-gray-100">
                {pageItems.map((w) => {
                  const busy = busyId === w.id;
                  return (
                    <div key={w.id} className="flex flex-wrap items-start justify-between gap-3 p-4">
                      <div className="flex min-w-0 flex-1 items-start gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-peach text-brand-burgundy">
                          <Landmark className="h-4.5 w-4.5" aria-hidden="true" />
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-text-primary">
                            {w.storeName}
                            <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-text-secondary">
                              {w.storeKind === 'service' ? 'Jasa' : 'Produk'}
                            </span>
                          </p>
                          <p className="text-xs text-text-secondary">
                            {w.ownerName} · {w.ownerEmail}
                          </p>
                          <p className="mt-1 text-xs text-text-primary">
                            {w.bankName} {w.accountNumber} a.n. {w.accountHolder}
                          </p>
                          <p className="mt-1 text-xs text-text-secondary">
                            Diajukan {formatDateId(w.createdAt)}
                            {w.processedAt && ` · Diproses ${formatDateId(w.processedAt)}`}
                          </p>
                          {w.adminNote && <p className="mt-1 text-xs text-text-secondary">Catatan admin: {w.adminNote}</p>}
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <p className="font-heading text-base font-bold text-text-primary">{formatRupiah(w.amount)}</p>
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${withdrawalBadgeClass(w.status)}`}>
                          {WITHDRAWAL_STATUS_LABELS[w.status] || w.status}
                        </span>
                        {(w.status === 'pending' || w.status === 'processing') && (
                          <div className="flex flex-wrap justify-end gap-2">
                            {w.status === 'pending' && (
                              <Button size="sm" variant="outline" disabled={busy} loading={busy} onClick={() => handleProcess(w)} playful={false}>
                                Proses
                              </Button>
                            )}
                            {w.status === 'processing' && (
                              <Button
                                size="sm"
                                variant="primary"
                                disabled={busy}
                                onClick={() => setDialogTarget({ decision: 'completed', withdrawal: w })}
                                playful={false}
                              >
                                Tandai selesai
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              className="!border-status-danger !text-status-danger hover:!bg-status-danger/5"
                              disabled={busy}
                              onClick={() => setDialogTarget({ decision: 'rejected', withdrawal: w })}
                              playful={false}
                            >
                              Tolak
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
            <Pagination page={wPage} pageSize={PAGE_SIZE} total={filtered.length} itemLabel="pencairan" onPageChange={setWPage} />
          </>
        )}
      </section>

      <WithdrawalDialog
        open={Boolean(dialogTarget)}
        decision={dialogTarget?.decision}
        withdrawal={dialogTarget?.withdrawal}
        loading={Boolean(dialogTarget) && busyId === dialogTarget.withdrawal.id}
        onConfirm={handleDialogConfirm}
        onCancel={() => setDialogTarget(null)}
      />
    </div>
  );
}
