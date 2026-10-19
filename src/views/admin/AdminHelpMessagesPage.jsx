import { useEffect, useMemo, useState } from 'react';
import { Search, Mail, User, Send, Clock, Copy, AlertTriangle } from 'lucide-react';
import Card from '../../components/Card';
import Input from '../../components/Input';
import Select from '../../components/Select';
import Button from '../../components/Button';
import Textarea from '../../components/Textarea';
import Pagination from '../../components/Pagination';
import EmptyState from '../../components/EmptyState';
import PawLoader from '../../components/decorative/PawLoader';
import { useAuth } from '../../hooks/useAuth';
import { fetchHelpMessages, replyHelpMessage, HELP_MESSAGE_STATUS_LABELS } from '../../utils/admin';
import { formatRelativeTimeId, formatDateId } from '../../utils/status';

const PAGE_SIZE = 8;

const STATUS_OPTIONS = [
  { value: 'all', label: 'Semua Status' },
  ...Object.entries(HELP_MESSAGE_STATUS_LABELS).map(([value, label]) => ({ value, label })),
];

function statusBadgeClass(status) {
  if (status === 'belum_dibalas') return 'bg-status-warning/30 text-text-primary';
  return 'bg-status-success/20 text-status-success';
}

export default function AdminHelpMessagesPage() {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState(null);

  const load = () => {
    setIsLoading(true);
    fetchHelpMessages({ search: query, status })
      .then(setMessages)
      .catch((err) => {
        console.error('fetchHelpMessages failed:', err);
        setError(err);
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, status]);

  useEffect(() => setPage(1), [query, status]);

  const pageItems = useMemo(() => messages.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [messages, page]);
  const selected = useMemo(() => messages.find((m) => m.id === selectedId) || null, [messages, selectedId]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          className="flex-1"
          placeholder="Cari nama, email, subjek, atau isi pesan..."
          icon={<Search className="h-4 w-4" />}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <Select className="sm:w-48" value={status} onChange={(e) => setStatus(e.target.value)} options={STATUS_OPTIONS} />
      </div>

      {isLoading && <PawLoader label="Memuat pesan..." />}

      {!isLoading && error && (
        <Card>
          <p className="text-sm text-status-danger">
            Gagal memuat data. Pastikan migrasi{' '}
            <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs">supabase/help_messages_migration.sql</code> sudah dijalankan.
          </p>
        </Card>
      )}

      {!isLoading && !error && messages.length === 0 && (
        <EmptyState title="Tidak ada pesan" subtitle="Belum ada pesan bantuan yang cocok dengan pencarian atau filter ini." />
      )}

      {!isLoading && !error && messages.length > 0 && (
        <>
          <Card className="!p-0 overflow-hidden">
            <div className="divide-y divide-gray-100">
              {pageItems.map((message) => (
                <button
                  key={message.id}
                  type="button"
                  onClick={() => setSelectedId(message.id)}
                  className="flex w-full flex-wrap items-center justify-between gap-3 p-4 text-left transition-colors duration-150 hover:bg-brand-peach/30"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-text-primary">{message.subject !== '-' ? message.subject : message.body.slice(0, 60)}</p>
                    <p className="truncate text-xs text-text-secondary" suppressHydrationWarning>
                      {message.name} ({message.email}) &middot; {formatRelativeTimeId(message.createdAt)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {!message.userId && (
                      <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-text-secondary">
                        Tanpa akun
                      </span>
                    )}
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusBadgeClass(message.status)}`}>
                      {HELP_MESSAGE_STATUS_LABELS[message.status]}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </Card>
          <Pagination page={page} pageSize={PAGE_SIZE} total={messages.length} itemLabel="pesan" onPageChange={setPage} />
        </>
      )}

      {selected && (
        <HelpMessageDetailPanel
          message={selected}
          adminId={user?.id}
          onClose={() => setSelectedId(null)}
          onChanged={load}
        />
      )}
    </div>
  );
}

function HelpMessageDetailPanel({ message, adminId, onClose, onChanged }) {
  const [reply, setReply] = useState(message.adminReply || '');
  const [sending, setSending] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleSendReply = async () => {
    if (!reply.trim() || !adminId) return;
    setSending(true);
    try {
      await replyHelpMessage(
        message.id,
        adminId,
        reply.trim(),
        message.subject !== '-' ? message.subject : message.name,
        message.userId,
      );
      onChanged();
      onClose();
    } catch (err) {
      console.error('replyHelpMessage failed:', err);
      window.alert('Gagal mengirim balasan. Coba lagi.');
    } finally {
      setSending(false);
    }
  };

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText(message.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
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
              {message.subject !== '-' ? message.subject : 'Pesan Bantuan'}
            </h2>
            <p className="text-xs text-text-secondary">Dikirim {formatDateId(message.createdAt)}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Tutup
          </Button>
        </div>

        <div className="mt-4 space-y-2 rounded-2xl bg-brand-cream/50 p-4 text-sm">
          <div className="flex items-center gap-2 text-text-secondary">
            <User className="h-4 w-4" /> <span className="font-medium text-text-primary">{message.name}</span>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-text-secondary">
            <Mail className="h-4 w-4" /> {message.email}
            <Button variant="ghost" size="sm" icon={<Copy className="h-3.5 w-3.5" />} onClick={handleCopyEmail}>
              {copied ? 'Tersalin' : 'Salin email'}
            </Button>
          </div>
          <p className="pt-1 text-text-primary">{message.body}</p>
        </div>

        {!message.userId && (
          <div className="mt-4 flex items-start gap-2 rounded-2xl border border-status-warning/40 bg-status-warning/10 p-4 text-sm text-text-primary">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-status-warning" />
            <p>
              Pesan ini dikirim tanpa akun (pengirim tidak login). Balasan yang kamu tulis di sini{' '}
              <strong>tidak bisa diterima pengirim di aplikasi</strong> — gunakan tombol &ldquo;Salin email&rdquo; di
              atas untuk membalas langsung lewat email kamu sendiri.
            </p>
          </div>
        )}

        {message.status === 'sudah_dibalas' && (
          <div className="mt-4 space-y-1 rounded-2xl border border-status-success/30 bg-status-success/5 p-4 text-sm">
            <div className="flex items-center gap-2 text-xs font-semibold text-status-success">
              <Clock className="h-3.5 w-3.5" /> Dibalas {message.repliedAt ? formatDateId(message.repliedAt) : ''}
              {message.repliedByName ? ` oleh ${message.repliedByName}` : ''}
            </div>
            <p className="text-text-primary">{message.adminReply}</p>
          </div>
        )}

        <div className="mt-4 space-y-2">
          <Textarea
            label={message.status === 'sudah_dibalas' ? 'Kirim balasan baru' : 'Balas pesan ini'}
            placeholder="Tulis balasan untuk pengguna..."
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            rows={4}
          />
          <Button
            icon={<Send className="h-4 w-4" />}
            loading={sending}
            disabled={!reply.trim()}
            onClick={handleSendReply}
          >
            Kirim Balasan
          </Button>
        </div>
      </div>
    </div>
  );
}
