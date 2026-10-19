import { useEffect, useMemo, useState } from 'react';
import { Search, Send, User, Store, Package, Scissors, ShoppingBag, CalendarClock } from 'lucide-react';
import Card from '../../components/Card';
import Input from '../../components/Input';
import Select from '../../components/Select';
import Button from '../../components/Button';
import Textarea from '../../components/Textarea';
import Pagination from '../../components/Pagination';
import EmptyState from '../../components/EmptyState';
import PawLoader from '../../components/decorative/PawLoader';
import { useAuth } from '../../hooks/useAuth';
import {
  fetchAllReports,
  setReportStatus,
  setReportPriority,
  fetchReportMessages,
  sendReportReply,
  REPORT_CATEGORY_LABELS,
  REPORT_PRIORITY_LABELS,
  REPORT_STATUS_LABELS,
} from '../../utils/admin';
import { formatRelativeTimeId, formatDateId } from '../../utils/status';

const PAGE_SIZE = 8;

const STATUS_OPTIONS = [{ value: 'all', label: 'Semua Status' }, ...Object.entries(REPORT_STATUS_LABELS).map(([value, label]) => ({ value, label }))];
const PRIORITY_OPTIONS = [{ value: 'all', label: 'Semua Prioritas' }, ...Object.entries(REPORT_PRIORITY_LABELS).map(([value, label]) => ({ value, label }))];
const STATUS_FORM_OPTIONS = Object.entries(REPORT_STATUS_LABELS).map(([value, label]) => ({ value, label }));
const PRIORITY_FORM_OPTIONS = Object.entries(REPORT_PRIORITY_LABELS).map(([value, label]) => ({ value, label }));

function statusBadgeClass(status) {
  if (status === 'baru') return 'bg-status-warning/30 text-text-primary';
  if (status === 'diproses') return 'bg-brand-peach text-brand-burgundy';
  if (status === 'selesai') return 'bg-status-success/20 text-status-success';
  return 'bg-gray-100 text-text-secondary';
}

function priorityBadgeClass(priority) {
  if (priority === 'urgent') return 'bg-status-danger text-white';
  if (priority === 'high') return 'bg-status-danger/15 text-status-danger';
  if (priority === 'low') return 'bg-gray-100 text-text-secondary';
  return 'bg-brand-peach text-brand-burgundy';
}

export default function AdminReportsPage() {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [priority, setPriority] = useState('all');
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState(null);

  const load = () => {
    setIsLoading(true);
    fetchAllReports({ search: query, status, priority })
      .then(setReports)
      .catch((err) => {
        console.error('fetchAllReports failed:', err);
        setError(err);
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, status, priority]);

  useEffect(() => setPage(1), [query, status, priority]);

  const pageItems = useMemo(() => reports.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [reports, page]);
  const selected = useMemo(() => reports.find((r) => r.id === selectedId) || null, [reports, selectedId]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          className="flex-1"
          placeholder="Cari ID laporan, pelapor, terlapor, atau isi laporan..."
          icon={<Search className="h-4 w-4" />}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <Select className="sm:w-48" value={status} onChange={(e) => setStatus(e.target.value)} options={STATUS_OPTIONS} />
        <Select className="sm:w-48" value={priority} onChange={(e) => setPriority(e.target.value)} options={PRIORITY_OPTIONS} />
      </div>

      {isLoading && <PawLoader label="Memuat laporan..." />}

      {!isLoading && error && (
        <Card>
          <p className="text-sm text-status-danger">
            Gagal memuat data. Pastikan migrasi{' '}
            <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs">supabase/reports_migration.sql</code> sudah dijalankan.
          </p>
        </Card>
      )}

      {!isLoading && !error && reports.length === 0 && (
        <EmptyState title="Tidak ada laporan" subtitle="Belum ada laporan yang cocok dengan pencarian atau filter ini." />
      )}

      {!isLoading && !error && reports.length > 0 && (
        <>
          <Card className="!p-0 overflow-hidden">
            <div className="divide-y divide-gray-100">
              {pageItems.map((report) => (
                <button
                  key={report.id}
                  type="button"
                  onClick={() => setSelectedId(report.id)}
                  className="flex w-full flex-wrap items-center justify-between gap-3 p-4 text-left transition-colors duration-150 hover:bg-brand-peach/30"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-semibold text-text-primary">
                        {REPORT_CATEGORY_LABELS[report.category] || report.category}
                      </p>
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${priorityBadgeClass(report.priority)}`}>
                        {REPORT_PRIORITY_LABELS[report.priority]}
                      </span>
                    </div>
                    <p className="truncate text-xs text-text-secondary" suppressHydrationWarning>
                      {report.reporterName} melaporkan {report.reportedUserName || report.reportedStoreName || 'pihak lain'} &middot;{' '}
                      {formatRelativeTimeId(report.createdAt)}
                    </p>
                  </div>
                  <span className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusBadgeClass(report.status)}`}>
                    {REPORT_STATUS_LABELS[report.status]}
                  </span>
                </button>
              ))}
            </div>
          </Card>
          <Pagination page={page} pageSize={PAGE_SIZE} total={reports.length} itemLabel="laporan" onPageChange={setPage} />
        </>
      )}

      {selected && (
        <ReportDetailPanel
          report={selected}
          adminId={user?.id}
          onClose={() => setSelectedId(null)}
          onChanged={load}
        />
      )}
    </div>
  );
}

function ReportDetailPanel({ report, adminId, onClose, onChanged }) {
  const [messages, setMessages] = useState([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [busy, setBusy] = useState(false);
  const [messageError, setMessageError] = useState(null);

  const loadMessages = () => {
    setIsLoadingMessages(true);
    fetchReportMessages(report.id)
      .then(setMessages)
      .catch((err) => {
        console.error('fetchReportMessages failed:', err);
        setMessageError(err);
      })
      .finally(() => setIsLoadingMessages(false));
  };

  useEffect(loadMessages, [report.id]);

  const handleStatusChange = async (value) => {
    setBusy(true);
    try {
      await setReportStatus(
        report.id,
        value,
        REPORT_CATEGORY_LABELS[report.category] || report.category,
        report.reporterId,
      );
      onChanged();
    } catch (err) {
      console.error('setReportStatus failed:', err);
    } finally {
      setBusy(false);
    }
  };

  const handlePriorityChange = async (value) => {
    setBusy(true);
    try {
      await setReportPriority(report.id, value, REPORT_CATEGORY_LABELS[report.category] || report.category);
      onChanged();
    } catch (err) {
      console.error('setReportPriority failed:', err);
    } finally {
      setBusy(false);
    }
  };

  const handleSendReply = async () => {
    if (!reply.trim() || !adminId) return;
    setSending(true);
    try {
      await sendReportReply(
        report.id,
        adminId,
        reply.trim(),
        REPORT_CATEGORY_LABELS[report.category] || report.category,
        report.reporterId,
      );
      setReply('');
      loadMessages();
      onChanged();
    } catch (err) {
      console.error('sendReportReply failed:', err);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/40 sm:items-center" onClick={onClose}>
      <div
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-t-2xl bg-white p-5 sm:rounded-2xl sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-heading text-lg font-bold text-text-primary">
              {REPORT_CATEGORY_LABELS[report.category] || report.category}
            </h2>
            <p className="text-xs text-text-secondary">Dilaporkan {formatDateId(report.createdAt)}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Tutup
          </Button>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Select
            label="Status"
            value={report.status}
            onChange={(e) => handleStatusChange(e.target.value)}
            options={STATUS_FORM_OPTIONS}
          />
          <Select
            label="Prioritas"
            value={report.priority}
            onChange={(e) => handlePriorityChange(e.target.value)}
            options={PRIORITY_FORM_OPTIONS}
          />
        </div>

        <div className="mt-4 space-y-2 rounded-2xl bg-brand-cream/50 p-4 text-sm">
          <div className="flex items-center gap-2 text-text-secondary">
            <User className="h-4 w-4" /> Pelapor: <span className="font-medium text-text-primary">{report.reporterName}</span>
            <span className="text-xs">({report.reporterEmail})</span>
          </div>
          {(report.reportedUserName || report.reportedStoreName) && (
            <div className="flex items-center gap-2 text-text-secondary">
              {report.reportedStoreName ? <Store className="h-4 w-4" /> : <User className="h-4 w-4" />}
              Terlapor: <span className="font-medium text-text-primary">{report.reportedUserName || report.reportedStoreName}</span>
            </div>
          )}
          <p className="pt-1 text-text-primary">{report.description}</p>

          {(report.orderId || report.bookingId || report.productId || report.serviceId) && (
            <div className="flex flex-wrap gap-2 pt-2">
              {report.orderId && (
                <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs text-text-secondary">
                  <ShoppingBag className="h-3.5 w-3.5" /> Transaksi #{report.orderId.slice(0, 8)}
                </span>
              )}
              {report.bookingId && (
                <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs text-text-secondary">
                  <CalendarClock className="h-3.5 w-3.5" /> Booking #{report.bookingId.slice(0, 8)}
                </span>
              )}
              {report.productName && (
                <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs text-text-secondary">
                  <Package className="h-3.5 w-3.5" /> {report.productName}
                </span>
              )}
              {report.serviceName && (
                <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs text-text-secondary">
                  <Scissors className="h-3.5 w-3.5" /> {report.serviceName}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="mt-4">
          <h3 className="text-sm font-semibold text-text-primary">Percakapan</h3>
          {isLoadingMessages && <PawLoader label="Memuat percakapan..." />}
          {!isLoadingMessages && messageError && (
            <p className="mt-2 text-xs text-status-danger">Gagal memuat percakapan.</p>
          )}
          {!isLoadingMessages && !messageError && (
            <div className="mt-2 max-h-56 space-y-2 overflow-y-auto rounded-xl bg-gray-50 p-3">
              {messages.length === 0 && <p className="text-xs text-text-secondary">Belum ada balasan.</p>}
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`max-w-[85%] rounded-xl px-3 py-2 text-xs ${
                    m.isAdmin ? 'ml-auto bg-brand-burgundy text-white' : 'bg-white text-text-primary'
                  }`}
                >
                  <p className="mb-0.5 font-semibold">{m.isAdmin ? 'Admin' : m.senderName}</p>
                  <p>{m.body}</p>
                </div>
              ))}
            </div>
          )}

          <div className="mt-3 flex items-end gap-2">
            <Textarea
              className="flex-1"
              rows={2}
              placeholder="Balas pelapor..."
              value={reply}
              onChange={(e) => setReply(e.target.value)}
            />
            <Button size="sm" icon={<Send className="h-4 w-4" />} loading={sending} disabled={busy} onClick={handleSendReply}>
              Kirim
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
