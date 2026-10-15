import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from '@/lib/router';
import { AlertTriangle, MessageCircle } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import WaveDivider from '../components/decorative/WaveDivider';
import Card from '../components/Card';
import Button from '../components/Button';
import ImagePlaceholder from '../components/ImagePlaceholder';
import OrderStatusStepper from '../components/OrderStatusStepper';
import ReviewModal from '../components/ReviewModal';
import ReportButton from '../components/ReportButton';
import PawLoader from '../components/decorative/PawLoader';
import { useChat } from '../hooks/useChat';
import { useAuth } from '../hooks/useAuth';
import { usePets } from '../context/PetContext';
import { supabase } from '../lib/supabaseClient';
import { fetchBookingById, setBookingStatus } from '../utils/bookings';
import { createReview, hasReviewed } from '../utils/reviews';
import { BOOKING_FLOW, statusLabel, statusBadge } from '../utils/statusConstants';
import { formatPrice } from '../utils/validation';
import { formatDateId } from '../utils/status';
import { useLanguage } from '../i18n/LanguageContext';

export default function BookingStatusPage() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, lang } = useLanguage();
  const { findOrCreateConversation } = useChat();
  const { pets } = usePets();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [reviewed, setReviewed] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState('');

  const load = useCallback(async () => {
    if (!user?.id) return;
    try {
      const row = await fetchBookingById(user.id, bookingId);
      setBooking(row);
      setLoadError('');
      if (row) {
        const done = await hasReviewed({ bookingId: row.id });
        setReviewed(done);
      }
    } catch (err) {
      console.error('BookingStatusPage load failed:', err);
      setLoadError(err?.message || 'Gagal memuat booking.');
    } finally {
      setLoading(false);
    }
  }, [user?.id, bookingId]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  // Perbarui otomatis saat penyedia jasa mengubah status booking.
  useEffect(() => {
    if (!user?.id || !bookingId) return undefined;
    const channel = supabase
      .channel(`booking-status-${bookingId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'bookings', filter: `id=eq.${bookingId}` },
        () => {
          load();
        },
      )
      .subscribe();
    const poller = window.setInterval(() => load(), 30000);
    return () => {
      supabase.removeChannel(channel);
      window.clearInterval(poller);
    };
  }, [user?.id, bookingId, load]);

  const handleChatProvider = async () => {
    if (!booking?.storeId) return;
    setChatError('');
    setChatLoading(true);
    try {
      const conversationId = await findOrCreateConversation(booking.storeId, {
        type: 'booking',
        thumbnail: booking.thumbnail || null,
        title: `${booking.name} — ${booking.id}`,
        linkTo: `/booking/${booking.id}/status`,
      });
      navigate(`/chat/${conversationId}`);
    } catch (err) {
      setChatError(err.message || 'Gagal membuka chat, coba lagi.');
    } finally {
      setChatLoading(false);
    }
  };

  const runAction = async (status) => {
    if (!booking) return;
    setActionLoading(true);
    try {
      await setBookingStatus(booking.id, status, 'buyer');
      setCancelOpen(false);
      await load();
    } catch (err) {
      console.error(err);
      setLoadError(err?.message || 'Gagal mengubah status booking.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReviewSubmit = async ({ rating, comment }) => {
    if (!booking || !user?.id) return;
    try {
      await createReview({
        authorId: user.id,
        serviceId: booking.serviceId,
        bookingId: booking.id,
        rating,
        comment,
      });
      setReviewed(true);
      setReviewOpen(false);
    } catch (err) {
      console.error(err);
      setLoadError(err?.message || 'Gagal menyimpan ulasan.');
    }
  };

  if (!loading && !booking) {
    return (
      <>
        <Navbar />
        <main className="mx-auto max-w-container px-4 py-16 text-center">
          <h1 className="font-heading text-2xl font-bold">{t('bookingStatus.notFoundTitle')}</h1>
          <Link to="/profil/riwayat" className="mt-4 inline-block text-sm font-medium text-brand-burgundy hover:underline">
            {t('bookingStatus.backToHistory')}
          </Link>
        </main>
        <WaveDivider topColor="text-brand-cream" bottomColor="bg-brand-burgundy" />
        <Footer />
      </>
    );
  }

  if (loading || !booking) {
    return (
      <>
        <Navbar />
        <main className="mx-auto max-w-container px-4 py-16 text-center">
          <div className="flex flex-col items-center gap-3 text-text-secondary">
            <PawLoader />
            <p className="text-sm">{t('bookingStatus.loading')}</p>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const pet = pets.find((item) => item.id === booking?.petId);
  const label = statusLabel(booking.status, lang);
  const canCancel = booking.status === 'pending_confirmation' || booking.status === 'confirmed';
  const canComplete = booking.status === 'in_progress';
  const canReview = booking.status === 'completed' && !reviewed;
  const afterConfirm = booking.status === 'confirmed' || booking.status === 'in_progress';

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-container space-y-5 px-4 py-8 md:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs text-text-secondary">{t('bookingStatus.bookingNumber')}</p>
            <h1 className="font-heading text-2xl font-bold text-text-primary">{booking.id}</h1>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusBadge(booking.status, lang)}`}>{label}</span>
        </div>

        {loadError && <p className="text-sm font-medium text-status-danger">{loadError}</p>}

        {booking.status !== 'cancelled' && (
          <Card>
            <OrderStatusStepper stages={BOOKING_FLOW} current={booking.status} />
          </Card>
        )}

        <Card>
          <h2 className="mb-4 font-heading text-lg font-bold">{t('bookingStatus.scheduleDetail')}</h2>
          <div className="grid gap-2 text-sm">
            <p>
              <span className="text-text-secondary">{t('bookingStatus.dateLabel')} </span>
              <span className="font-medium">{formatDateId(booking.date)}</span>
            </p>
            <p>
              <span className="text-text-secondary">{t('bookingStatus.timeLabel')} </span>
              <span className="font-medium">{booking.time}</span>
            </p>
            <p>
              <span className="text-text-secondary">{t('bookingStatus.packageLabel')} </span>
              <span className="font-medium">{booking.packageName || booking.name}</span>
            </p>
            <p>
              <span className="text-text-secondary">{t('bookingStatus.priceLabel')} </span>
              <span className="font-medium">{formatPrice(booking.packagePrice || booking.totalPrice)}</span>
            </p>
          </div>
          <div className="mt-4 flex items-center gap-3">
            {pet?.photoUrl ? (
              <img src={pet.photoUrl} alt="" className="h-12 w-12 rounded-full object-cover" />
            ) : (
              <ImagePlaceholder className="h-12 w-12 rounded-full" alt={booking.petName} showIcon={false} />
            )}
            <div>
              <p className="text-xs text-text-secondary">{t('bookingStatus.bookedPet')}</p>
              <p className="font-medium text-text-primary">{pet?.name || booking.petName}</p>
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="mb-4 font-heading text-lg font-bold">{t('bookingStatus.providerInfo')}</h2>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <ImagePlaceholder className="h-12 w-12 rounded-full" alt={booking.providerName} showIcon={false} />
              <div>
                {booking.storeId ? (
                  <Link
                    to={`/toko/${booking.storeId}`}
                    className="font-heading font-bold text-text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange-end/40"
                  >
                    {booking.providerName}
                  </Link>
                ) : (
                  <p className="font-heading font-bold text-text-primary">{booking.providerName}</p>
                )}
                {booking.providerRating != null && (
                  <p className="text-sm text-text-secondary">{t('bookingStatus.ratingLabel').replace('{value}', booking.providerRating)}</p>
                )}
                {!booking.storeId && (
                  <p className="text-xs text-text-secondary">{t('chat.demoUnavailable')}</p>
                )}
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              icon={<MessageCircle className="h-4 w-4" />}
              onClick={handleChatProvider}
              loading={chatLoading}
              disabled={!booking.storeId}
            >
              {t('bookingStatus.chatProvider')}
            </Button>
          </div>
        </Card>

        {chatError && <p className="text-sm text-status-danger">{chatError}</p>}

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            variant="outline"
            icon={<MessageCircle className="h-4 w-4" />}
            onClick={handleChatProvider}
            loading={chatLoading}
            disabled={!booking.storeId}
          >
            {t('bookingStatus.chatProvider')}
          </Button>
          {canCancel && (
            <Button variant="outline" className="text-status-danger border-status-danger" onClick={() => setCancelOpen(true)}>
              {t('bookingStatus.cancelBooking')}
            </Button>
          )}
          {canComplete && (
            <Button variant="primary" onClick={() => runAction('completed')} loading={actionLoading}>
              {t('bookingStatus.confirmCompletion')}
            </Button>
          )}
          {canReview && (
            <Button variant="outline" onClick={() => setReviewOpen(true)}>
              {t('bookingStatus.giveReview')}
            </Button>
          )}
        </div>

        <ReportButton
          reportedStoreId={booking.storeId}
          reportedStoreName={booking.providerName}
          context={{ bookingId: booking.id, bookingLabel: `${t('report.contextBooking')} ${booking.id}` }}
        />
      </main>

      {cancelOpen && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center">
          <button type="button" className="absolute inset-0 bg-black/40" aria-label={t('bookingStatus.closeAria')} onClick={() => setCancelOpen(false)} />
          <div className="relative z-10 w-full max-w-md rounded-t-3xl bg-white p-5 shadow-lg sm:rounded-2xl">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-6 w-6 shrink-0 text-status-warning" />
              <div>
                <h2 className="font-heading text-lg font-bold">{t('bookingStatus.cancelConfirmTitle')}</h2>
                <p className="mt-2 text-sm text-text-secondary">
                  {afterConfirm
                    ? t('bookingStatus.cancelConfirmAfterConfirm')
                    : t('bookingStatus.cancelConfirmDefault')}
                </p>
              </div>
            </div>
            <div className="mt-5 flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setCancelOpen(false)}>
                {t('bookingStatus.back')}
              </Button>
              <Button
                variant="outline"
                className="flex-1 text-status-danger border-status-danger"
                onClick={() => runAction('cancelled')}
                loading={actionLoading}
              >
                {t('bookingStatus.yesCancelIt')}
              </Button>
            </div>
          </div>
        </div>
      )}

      <ReviewModal
        open={reviewOpen}
        title={`${t('bookingStatus.reviewTitlePrefix')} ${booking.name}`}
        onClose={() => setReviewOpen(false)}
        onSubmit={handleReviewSubmit}
      />
      <WaveDivider topColor="text-brand-cream" bottomColor="bg-brand-burgundy" />
      <Footer />
    </>
  );
}