import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from '@/lib/router';
import { MessageCircle } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import WaveDivider from '../components/decorative/WaveDivider';
import Card from '../components/Card';
import Button from '../components/Button';
import ImagePlaceholder from '../components/ImagePlaceholder';
import OrderStatusStepper from '../components/OrderStatusStepper';
import TrackingCard from '../components/TrackingCard';
import ShippingInfoCard from '../components/ShippingInfoCard';
import ReviewModal from '../components/ReviewModal';
import ReportButton from '../components/ReportButton';
import PawLoader from '../components/decorative/PawLoader';
import { useChat } from '../hooks/useChat';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabaseClient';
import { fetchOrderById, setOrderStatus } from '../utils/orders';
import { createReview, hasReviewed } from '../utils/reviews';
import { ORDER_FLOW, statusLabel, statusBadge } from '../utils/statusConstants';
import { formatPrice } from '../utils/validation';
import { useLanguage } from '../i18n/LanguageContext';

export default function OrderStatusPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, lang } = useLanguage();
  const { findOrCreateConversation } = useChat();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [reviewed, setReviewed] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState('');

  const load = useCallback(async () => {
    if (!user?.id) return;
    try {
      const row = await fetchOrderById(user.id, orderId);
      setOrder(row);
      setLoadError('');
      if (row) {
        const done = await hasReviewed({ orderId: row.id });
        setReviewed(done);
      }
    } catch (err) {
      console.error('OrderStatusPage load failed:', err);
      setLoadError(err?.message || 'Gagal memuat pesanan.');
    } finally {
      setLoading(false);
    }
  }, [user?.id, orderId]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  // Perbarui otomatis saat penjual mengubah status (realtime + polling ringan).
  useEffect(() => {
    if (!user?.id || !orderId) return undefined;
    const channel = supabase
      .channel(`order-status-${orderId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${orderId}` },
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
  }, [user?.id, orderId, load]);

  const handleChatSeller = async () => {
    if (!order?.storeId) return;
    setChatError('');
    setChatLoading(true);
    try {
      const conversationId = await findOrCreateConversation(order.storeId, {
        type: 'order',
        thumbnail: order.thumbnail || null,
        title: `${order.name} — ${order.id}`,
        linkTo: `/pesanan/${order.id}`,
      });
      navigate(`/chat/${conversationId}`);
    } catch (err) {
      setChatError(err.message || 'Gagal membuka chat, coba lagi.');
    } finally {
      setChatLoading(false);
    }
  };

  const runAction = async (status) => {
    if (!order) return;
    setActionLoading(true);
    try {
      await setOrderStatus(order.id, status, 'buyer');
      await load();
    } catch (err) {
      console.error(err);
      setLoadError(err?.message || 'Gagal mengubah status pesanan.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReviewSubmit = async ({ rating, comment }) => {
    if (!order || !user?.id) return;
    try {
      await createReview({
        authorId: user.id,
        productId: order.items?.[0]?.product_id || null,
        orderId: order.id,
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

  if (!loading && !order) {
    return (
      <>
        <Navbar />
        <main className="mx-auto max-w-container px-4 py-16 text-center">
          <h1 className="font-heading text-2xl font-bold">{t('orderStatus.notFoundTitle')}</h1>
          <Link to="/profil/riwayat" className="mt-4 inline-block text-sm font-medium text-brand-burgundy hover:underline">
            {t('orderStatus.backToHistory')}
          </Link>
        </main>
        <WaveDivider topColor="text-brand-cream" bottomColor="bg-brand-burgundy" />
        <Footer />
      </>
    );
  }

  if (loading || !order) {
    return (
      <>
        <Navbar />
        <main className="mx-auto max-w-container px-4 py-16 text-center">
          <div className="flex flex-col items-center gap-3 text-text-secondary">
            <PawLoader />
            <p className="text-sm">{t('orderStatus.loading')}</p>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const label = statusLabel(order.status, lang);
  const canCancel = order.status === 'pending_payment';
  const canConfirm = order.status === 'shipped';
  const canReview = order.status === 'completed' && !reviewed;

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-container space-y-5 px-4 py-8 md:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs text-text-secondary">{t('orderStatus.orderNumber')}</p>
            <h1 className="font-heading text-2xl font-bold text-text-primary">{order.id}</h1>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusBadge(order.status, lang)}`}>{label}</span>
        </div>

        {loadError && <p className="text-sm font-medium text-status-danger">{loadError}</p>}

        {order.status !== 'cancelled' && (
          <Card>
            <OrderStatusStepper stages={ORDER_FLOW} current={order.status} />
          </Card>
        )}

        <Card>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <ImagePlaceholder className="h-12 w-12 rounded-full" alt={order.storeName} showIcon={false} />
              <div>
                <p className="text-xs text-text-secondary">{t('orderStatus.storeInfo')}</p>
                {order.storeName && order.storeId ? (
                  <Link
                    to={`/toko/${order.storeId}`}
                    className="font-heading font-bold text-text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange-end/40"
                  >
                    {order.storeName}
                  </Link>
                ) : (
                  <p className="font-heading font-bold text-text-primary">{order.storeName || 'Toko FurKeeper'}</p>
                )}
                {!order.storeId && <p className="text-xs text-text-secondary">{t('chat.demoUnavailable')}</p>}
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              icon={<MessageCircle className="h-4 w-4" />}
              onClick={handleChatSeller}
              loading={chatLoading}
              disabled={!order.storeId}
            >
              {t('orderStatus.chatSeller')}
            </Button>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            {order.thumbnail ? (
              <img src={order.thumbnail} alt="" className="h-16 w-16 rounded-lg object-cover" />
            ) : (
              <ImagePlaceholder className="h-16 w-16 rounded-lg" alt={order.name} />
            )}
            <div className="min-w-0 flex-1">
              <p className="font-medium text-text-primary">{order.name}</p>
              <p className="text-xs text-text-secondary">
                {order.variant ? `${order.variant} · ` : ''}x{order.qty}
              </p>
            </div>
            <p className="text-sm font-semibold">{formatPrice(order.price)}</p>
          </div>
        </Card>

        <ShippingInfoCard address={order.address} />

        {(order.status === 'shipped' || order.status === 'completed') && <TrackingCard tracking={order.tracking} />}

        {chatError && <p className="text-sm text-status-danger">{chatError}</p>}

        <div className="flex flex-col gap-2 sm:flex-row">
          {canCancel && (
            <Button
              variant="outline"
              className="!text-status-danger"
              onClick={() => runAction('cancelled')}
              loading={actionLoading}
            >
              {t('orderStatus.cancelOrder')}
            </Button>
          )}
          {canConfirm && (
            <Button variant="primary" onClick={() => runAction('completed')} loading={actionLoading}>
              {t('orderStatus.orderReceived')}
            </Button>
          )}
          {canReview && (
            <Button variant="outline" onClick={() => setReviewOpen(true)}>
              {t('orderStatus.giveReview')}
            </Button>
          )}
        </div>

        <ReportButton
          reportedStoreId={order.storeId}
          reportedStoreName={order.storeName}
          context={{ orderId: order.id, orderLabel: `${t('report.contextOrder')} ${order.id}` }}
        />
      </main>
      <ReviewModal
        open={reviewOpen}
        title={`${t('orderStatus.reviewTitlePrefix')} ${order.name}`}
        onClose={() => setReviewOpen(false)}
        onSubmit={handleReviewSubmit}
      />
      <WaveDivider topColor="text-brand-cream" bottomColor="bg-brand-burgundy" />
      <Footer />
    </>
  );
}