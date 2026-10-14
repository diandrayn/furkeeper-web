import { useEffect, useMemo, useState } from 'react';
import { Search, User, Store, Package, Scissors, Star, Flag, Tags, Receipt, MessageCircle, CalendarClock } from 'lucide-react';
import Card from '../../components/Card';
import Input from '../../components/Input';
import Select from '../../components/Select';
import Pagination from '../../components/Pagination';
import EmptyState from '../../components/EmptyState';
import PawLoader from '../../components/decorative/PawLoader';
import {
  fetchActivityLog,
  fetchActivityLogActors,
  ACTIVITY_TARGET_TYPE_LABELS,
} from '../../utils/admin';
import { formatRelativeTimeId } from '../../utils/status';

const PAGE_SIZE = 12;

const TARGET_TYPE_OPTIONS = [
  { value: 'all', label: 'Semua Jenis' },
  ...Object.entries(ACTIVITY_TARGET_TYPE_LABELS).map(([value, label]) => ({ value, label })),
];

const TARGET_TYPE_ICONS = {
  user: User,
  store: Store,
  product: Package,
  service: Scissors,
  review: Star,
  report: Flag,
  category: Tags,
  order: Receipt,
  booking: Receipt,
  help_message: MessageCircle,
};

function actionBadgeClass(action) {
  if (action.startsWith('delete_') || action.startsWith('reject_') || action.startsWith('suspend_')) {
    return 'bg-status-danger/10 text-status-danger';
  }
  if (action.startsWith('approve_') || action.startsWith('activate_') || action.startsWith('unsuspend_')) {
    return 'bg-status-success/15 text-status-success';
  }
  return 'bg-brand-peach text-brand-burgundy';
}

function formatDateTimeId(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return `${date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}, ${date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB`;
}

function detailSummary(log) {
  if (!log.detail) return null;
  const { reason, status, priority, kind } = log.detail;
  const parts = [];
  if (reason) parts.push(`Alasan: ${reason}`);
  if (status) parts.push(`Status baru: ${status}`);
  if (priority) parts.push(`Prioritas baru: ${priority}`);
  if (kind) parts.push(kind === 'service' ? 'Kategori Jasa' : kind === 'seller' || kind === 'product' ? 'Kategori Produk' : null);
  return parts.filter(Boolean).join(' · ') || null;
}

export default function AdminActivityLogPage() {
  const [query, setQuery] = useState('');
  const [actorId, setActorId] = useState('all');
  const [targetType, setTargetType] = useState('all');
  const [actors, setActors] = useState([]);
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchActivityLogActors()
      .then(setActors)
      .catch((err) => console.error('fetchActivityLogActors failed:', err));
  }, []);

  const load = () => {
    setIsLoading(true);
    fetchActivityLog({ search: query, actorId, targetType })
      .then(setLogs)
      .catch((err) => {
        console.error('fetchActivityLog failed:', err);
        setError(err);
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, actorId, targetType]);

  useEffect(() => setPage(1), [query, actorId, targetType]);

  const actorOptions = useMemo(
    () => [{ value: 'all', label: 'Semua Admin' }, ...actors.map((a) => ({ value: a.id, label: a.name }))],
    [actors],
  );

  const pageItems = useMemo(() => logs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [logs, page]);

  return (
    <div className="space-y-5">
      <p className="text-sm text-text-secondary">
        Catatan siapa melakukan aksi apa dan kapan di seluruh dashboard admin — untuk audit trail. Hanya
        menampilkan 500 aktivitas terbaru.
      </p>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          className="flex-1"
          placeholder="Cari admin, aksi, atau target..."
          icon={<Search className="h-4 w-4" />}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <Select className="sm:w-52" value={actorId} onChange={(e) => setActorId(e.target.value)} options={actorOptions} />
        <Select className="sm:w-48" value={targetType} onChange={(e) => setTargetType(e.target.value)} options={TARGET_TYPE_OPTIONS} />
      </div>

      {isLoading && <PawLoader label="Memuat log aktivitas..." />}

      {!isLoading && error && (
        <Card>
          <p className="text-sm text-status-danger">
            Gagal memuat data. Pastikan migrasi{' '}
            <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs">supabase/activity_log_migration.sql</code>{' '}
            sudah dijalankan.
          </p>
        </Card>
      )}

      {!isLoading && !error && logs.length === 0 && (
        <EmptyState title="Belum ada aktivitas" subtitle="Belum ada aksi admin yang cocok dengan pencarian atau filter ini." />
      )}

      {!isLoading && !error && logs.length > 0 && (
        <>
          <Card className="!p-0 overflow-hidden">
            <div className="divide-y divide-gray-100">
              {pageItems.map((log) => {
                const Icon = TARGET_TYPE_ICONS[log.targetType] || CalendarClock;
                const summary = detailSummary(log);
                return (
                  <div key={log.id} className="flex flex-wrap items-start gap-3 p-4">
                    <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-peach/60 text-brand-burgundy">
                      <Icon className="h-4.5 w-4.5" aria-hidden="true" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-text-primary">{log.actorName}</p>
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${actionBadgeClass(log.action)}`}>
                          {log.actionLabel}
                        </span>
                      </div>
                      <p className="mt-0.5 truncate text-xs text-text-secondary">
                        {log.targetTypeLabel}
                        {log.targetLabel ? `: ${log.targetLabel}` : ''}
                        {summary ? ` · ${summary}` : ''}
                      </p>
                    </div>
                    <p
                      className="shrink-0 text-xs text-text-secondary"
                      title={formatDateTimeId(log.createdAt)}
                    >
                      {formatRelativeTimeId(log.createdAt)}
                    </p>
                  </div>
                );
              })}
            </div>
          </Card>
          <Pagination page={page} pageSize={PAGE_SIZE} total={logs.length} itemLabel="aktivitas" onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
