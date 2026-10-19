import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from '@/lib/router';
import { Mail, Clock, MessageCircle, Send, Store, ShoppingBag, CalendarClock, Package, Scissors } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Card from '../components/Card';
import Button from '../components/Button';
import Textarea from '../components/Textarea';
import EmptyState from '../components/EmptyState';
import PawLoader from '../components/decorative/PawLoader';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../i18n/LanguageContext';
import { fetchMyHelpMessages, HELP_MESSAGE_STATUS_LABELS } from '../utils/help';
import {
  fetchMyReports,
  fetchMyReportMessages,
  sendMyReportReply,
  markReportNotificationsRead,
  REPORT_CATEGORY_LABELS,
  REPORT_STATUS_LABELS,
} from '../utils/reports';
import { formatDateId, formatRelativeTimeId } from '../utils/status';

const TABS = [
  { id: 'pesan', labelKey: 'bantuanSaya.tabMessages' },
  { id: 'laporan', labelKey: 'bantuanSaya.tabReports' },
];

function statusBadgeClass(status) {
  if (status === 'belum_dibalas' || status === 'baru') return 'bg-status-warning/30 text-text-primary';
  if (status === 'diproses') return 'bg-brand-peach text-brand-burgundy';
  return 'bg-status-success/20 text-status-success';
}

export default function BantuanSayaPage() {
  const { t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab') === 'laporan' ? 'laporan' : 'pesan';
  const highlightId = searchParams.get('id');

  const setTab = (nextTab) => {
    const next = new URLSearchParams(searchParams);
    next.set('tab', nextTab);
    next.delete('id');
    setSearchParams(next, { replace: true });
  };

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-8 md:px-6 lg:px-8">
        <h1 className="font-heading text-2xl font-bold text-text-primary md:text-3xl">{t('bantuanSaya.title')}</h1>
        <p className="mt-1 text-sm text-text-secondary">{t('bantuanSaya.subtitle')}</p>

        <div className="mt-6 flex gap-2 rounded-xl bg-white p-1 shadow-sm">
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`flex-1 rounded-lg px-3 py-2 text-sm transition-colors duration-200 ${
                tab === item.id
                  ? 'bg-brand-orange-end/10 font-medium text-brand-burgundy'
                  : 'text-text-secondary hover:text-brand-burgundy'
              }`}
            >
              {t(item.labelKey)}
            </button>
          ))}
        </div>

        <div className="mt-5">
          {tab === 'pesan' ? <MyMessagesTab highlightId={highlightId} /> : <MyReportsTab highlightId={highlightId} />}
        </div>
      </main>
      <Footer />
    </>
  );
}

function MyMessagesTab({ highlightId }) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    fetchMyHelpMessages(user?.id)
      .then((data) => {
        if (!active) return;
        setMessages(data);
        setError(null);
      })
      .catch((err) => {
        if (!active) return;
        console.error('fetchMyHelpMessages failed:', err);
        setError(err);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [user?.id]);

  // Datang dari link notifikasi (/bantuan-saya?tab=pesan&id=<id>) — buka
  // langsung detail pesan itu begitu daftarnya selesai dimuat.
  useEffect(() => {
    if (highlightId && messages.some((m) => m.id === highlightId)) {
      setSelectedId(highlightId);
    }
  }, [highlightId, messages]);

  const selected = useMemo(() => messages.find((m) => m.id === selectedId) || null, [messages, selectedId]);

  if (isLoading) return <PawLoader label={t('bantuanSaya.loading')} />;

  if (error) {
    return (
      <Card>
        <p className="text-sm text-status-danger">{t('bantuanSaya.loadError')}</p>
      </Card>
    );
  }

  if (messages.length === 0) {
    return (
      <EmptyState
        title={t('bantuanSaya.emptyTitle')}
        subtitle={t('bantuanSaya.emptySubtitle')}
        action={
          <Link to="/kontak">
            <Button variant="outline">{t('bantuanSaya.emptyAction')}</Button>
          </Link>
        }
      />
    );
  }

  return (
    <>
      <Card className="!p-0 overflow-hidden">
        <div className="divide-y divide-gray-100">
          {messages.map((message) => (
            <button
              key={message.id}
              type="button"
              onClick={() => setSelectedId(message.id)}
              className="flex w-full flex-wrap items-center justify-between gap-3 p-4 text-left transition-colors duration-150 hover:bg-brand-peach/30"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-text-primary">
                  {message.subject !== '-' ? message.subject : message.body.slice(0, 60)}
                </p>
                <p className="truncate text-xs text-text-secondary" suppressHydrationWarning>{formatRelativeTimeId(message.createdAt)}</p>
              </div>
              <span className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusBadgeClass(message.status)}`}>
                {message.status === 'belum_dibalas' ? t('bantuanSaya.statusUnanswered') : t('bantuanSaya.statusAnswered')}
              </span>
            </button>
          ))}
        </div>
      </Card>

      {selected && (
        <div
          className="fixed inset-0 z-[70] flex items-end justify-center bg-black/40 sm:items-center"
          onClick={() => setSelectedId(null)}
        >
          <div
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-t-2xl bg-white p-5 sm:rounded-2xl sm:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-heading text-lg font-bold text-text-primary">
                  {selected.subject !== '-' ? selected.subject : t('bantuanSaya.tabMessages')}
                </h2>
                <p className="text-xs text-text-secondary">
                  {t('bantuanSaya.sentOn')} {formatDateId(selected.createdAt)}
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelectedId(null)}>
                {t('bantuanSaya.close')}
              </Button>
            </div>

            <div className="mt-4 space-y-2 rounded-2xl bg-brand-cream/50 p-4 text-sm">
              <div className="flex items-center gap-2 text-xs font-semibold text-text-secondary">
                <MessageCircle className="h-3.5 w-3.5" /> {t('bantuanSaya.yourMessage')}
              </div>
              <p className="text-text-primary">{selected.body}</p>
            </div>

            {selected.status === 'sudah_dibalas' ? (
              <div className="mt-4 space-y-1 rounded-2xl border border-status-success/30 bg-status-success/5 p-4 text-sm">
                <div className="flex items-center gap-2 text-xs font-semibold text-status-success">
                  <Clock className="h-3.5 w-3.5" />
                  {t('bantuanSaya.repliedOn')} {selected.repliedAt ? formatDateId(selected.repliedAt) : ''}
                  {selected.repliedByName ? ` ${t('bantuanSaya.repliedBy')} ${selected.repliedByName}` : ''}
                </div>
                <p className="text-text-primary">{selected.adminReply}</p>
              </div>
            ) : (
              <div className="mt-4 flex items-center gap-2 rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm text-text-secondary">
                <Mail className="h-4 w-4 shrink-0" /> {t('bantuanSaya.awaitingReply')}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function MyReportsTab({ highlightId }) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    fetchMyReports(user?.id)
      .then((data) => {
        if (!active) return;
        setReports(data);
        setError(null);
      })
      .catch((err) => {
        if (!active) return;
        console.error('fetchMyReports failed:', err);
        setError(err);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [user?.id]);

  // Membuka tab ini menandai notifikasi balasan/perubahan status laporan
  // sebagai sudah dibaca, supaya titik indikator di ProfileDropdown /
  // ProfileLayout hilang begitu user benar-benar melihat laporannya.
  useEffect(() => {
    if (user?.id) markReportNotificationsRead(user.id);
  }, [user?.id]);

  useEffect(() => {
    if (highlightId && reports.some((r) => r.id === highlightId)) {
      setSelectedId(highlightId);
    }
  }, [highlightId, reports]);

  const selected = useMemo(() => reports.find((r) => r.id === selectedId) || null, [reports, selectedId]);

  if (isLoading) return <PawLoader label={t('bantuanSaya.reportsLoading')} />;

  if (error) {
    return (
      <Card>
        <p className="text-sm text-status-danger">{t('bantuanSaya.reportsLoadError')}</p>
      </Card>
    );
  }

  if (reports.length === 0) {
    return <EmptyState title={t('bantuanSaya.reportsEmptyTitle')} subtitle={t('bantuanSaya.reportsEmptySubtitle')} />;
  }

  return (
    <>
      <Card className="!p-0 overflow-hidden">
        <div className="divide-y divide-gray-100">
          {reports.map((report) => (
            <button
              key={report.id}
              type="button"
              onClick={() => setSelectedId(report.id)}
              className="flex w-full flex-wrap items-center justify-between gap-3 p-4 text-left transition-colors duration-150 hover:bg-brand-peach/30"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-text-primary">
                  {REPORT_CATEGORY_LABELS[report.category] || report.category}
                </p>
                <p className="truncate text-xs text-text-secondary">
                  <span suppressHydrationWarning>{report.reportedStoreName} &middot; {formatRelativeTimeId(report.createdAt)}</span>
                </p>
              </div>
              <span className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusBadgeClass(report.status)}`}>
                {REPORT_STATUS_LABELS[report.status]}
              </span>
            </button>
          ))}
        </div>
      </Card>

      {selected && <MyReportDetailModal report={selected} userId={user?.id} onClose={() => setSelectedId(null)} />}
    </>
  );
}

function MyReportDetailModal({ report, userId, onClose }) {
  const { t } = useLanguage();
  const [messages, setMessages] = useState([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);
  const [messageError, setMessageError] = useState(null);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');

  const isClosed = report.status === 'selesai';

  const loadMessages = () => {
    setIsLoadingMessages(true);
    fetchMyReportMessages(report.id)
      .then((data) => {
        setMessages(data);
        setMessageError(null);
      })
      .catch((err) => {
        console.error('fetchMyReportMessages failed:', err);
        setMessageError(err);
      })
      .finally(() => setIsLoadingMessages(false));
  };

  useEffect(loadMessages, [report.id]);

  const handleSendReply = async () => {
    if (!reply.trim() || !userId || isClosed) return;
    setSending(true);
    setSendError('');
    try {
      await sendMyReportReply(report.id, userId, reply.trim());
      setReply('');
      loadMessages();
    } catch (err) {
      console.error('sendMyReportReply failed:', err);
      setSendError(t('report.errorGeneric'));
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
            <p className="text-xs text-text-secondary">
              {t('bantuanSaya.reportsFiledOn')} {formatDateId(report.createdAt)}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            {t('bantuanSaya.close')}
          </Button>
        </div>

        <div className="mt-4 space-y-2 rounded-2xl bg-brand-cream/50 p-4 text-sm">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-text-secondary">
              <Store className="h-4 w-4" /> {t('report.reportedLabel')}{' '}
              <span className="font-medium text-text-primary">{report.reportedStoreName}</span>
            </div>
            <span className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusBadgeClass(report.status)}`}>
              {REPORT_STATUS_LABELS[report.status]}
            </span>
          </div>
          <p className="pt-1 text-text-primary">{report.description}</p>

          {(report.orderId || report.bookingId || report.productName || report.serviceName) && (
            <div className="flex flex-wrap gap-2 pt-2">
              <span className="text-xs font-semibold text-text-secondary">{t('bantuanSaya.reportsContextLabel')}:</span>
              {report.orderId && (
                <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs text-text-secondary">
                  <ShoppingBag className="h-3.5 w-3.5" /> #{report.orderId.slice(0, 8)}
                </span>
              )}
              {report.bookingId && (
                <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs text-text-secondary">
                  <CalendarClock className="h-3.5 w-3.5" /> #{report.bookingId.slice(0, 8)}
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
          <h3 className="text-sm font-semibold text-text-primary">{t('bantuanSaya.reportsThreadTitle')}</h3>
          {isLoadingMessages && <PawLoader label={t('bantuanSaya.reportsLoading')} />}
          {!isLoadingMessages && messageError && (
            <p className="mt-2 text-xs text-status-danger">{t('bantuanSaya.reportsLoadError')}</p>
          )}
          {!isLoadingMessages && !messageError && (
            <div className="mt-2 max-h-56 space-y-2 overflow-y-auto rounded-xl bg-gray-50 p-3">
              {messages.length === 0 && <p className="text-xs text-text-secondary">{t('bantuanSaya.reportsNoMessages')}</p>}
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`max-w-[85%] rounded-xl px-3 py-2 text-xs ${
                    m.isAdmin ? 'bg-white text-text-primary' : 'ml-auto bg-brand-burgundy text-white'
                  }`}
                >
                  <p className="mb-0.5 font-semibold">{m.isAdmin ? t('bantuanSaya.reportsAdmin') : t('bantuanSaya.reportsYou')}</p>
                  <p>{m.body}</p>
                </div>
              ))}
            </div>
          )}

          {isClosed ? (
            <p className="mt-3 text-xs text-text-secondary">{t('bantuanSaya.reportsReplyClosed')}</p>
          ) : (
            <div className="mt-3 flex items-end gap-2">
              <Textarea
                className="flex-1"
                rows={2}
                placeholder={t('bantuanSaya.reportsReplyPlaceholder')}
                value={reply}
                onChange={(e) => setReply(e.target.value)}
              />
              <Button size="sm" icon={<Send className="h-4 w-4" />} loading={sending} onClick={handleSendReply}>
                {t('bantuanSaya.reportsSend')}
              </Button>
            </div>
          )}
          {sendError && <p className="mt-1 text-xs text-status-danger">{sendError}</p>}
        </div>
      </div>
    </div>
  );
}
