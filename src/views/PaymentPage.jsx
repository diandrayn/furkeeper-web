import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from '@/lib/router';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import WaveDivider from '../components/decorative/WaveDivider';
import Card from '../components/Card';
import Button from '../components/Button';
import CountdownTimer from '../components/CountdownTimer';
import PawLoader from '../components/decorative/PawLoader';
import { fetchOrdersByIds, fetchOrderById } from '../utils/orders';
import { fetchBookingById } from '../utils/bookings';
import { useAuth } from '../hooks/useAuth';
import { formatPrice } from '../utils/validation';
import { useLanguage } from '../i18n/LanguageContext';

export default function PaymentPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();

  const ids = (orderId || '').split(',').filter(Boolean);
  const [orders, setOrders] = useState([]);
  const [booking, setBooking] = useState(null);
  const [isBooking, setIsBooking] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    (async () => {
      try {
        if (ids.length > 1) {
          const rows = await fetchOrdersByIds(user?.id, ids);
          if (active) setOrders(rows);
        } else if (ids.length === 1) {
          const row = await fetchOrderById(user?.id, ids[0]);
          if (row) {
            if (active) setOrders([row]);
          } else {
            const b = await fetchBookingById(user?.id, ids[0]);
            if (active) {
              setBooking(b);
              setIsBooking(Boolean(b));
              if (!b) setError(t('payment.orderNotFound'));
            }
          }
        }
      } catch (err) {
        if (active) {
          console.error('PaymentPage load failed:', err);
          setError(err?.message || t('payment.orderNotFound'));
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [orderId, user?.id, t]);

  const total = isBooking ? booking?.price || 0 : orders.reduce((sum, o) => sum + (o.totalPrice || 0), 0);
  const idLabel = isBooking ? booking?.id || ids[0] : orders[0]?.id || ids[0];
  const deadline = Date.now() + 24 * 60 * 60 * 1000;

  const handleSuccess = () => {
    if (isBooking) {
      navigate(`/pembayaran/sukses?order=${encodeURIComponent(idLabel)}&kind=booking`);
    } else {
      navigate(`/pembayaran/sukses?order=${encodeURIComponent(idLabel)}`);
    }
  };

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-container px-4 py-10 md:px-6 lg:px-8">
        <h1 className="mb-8 text-center font-heading text-2xl font-bold md:text-3xl">{t('payment.title')}</h1>

        <div className="mx-auto grid max-w-4xl gap-6 lg:grid-cols-[1fr_280px]">
          <Card className="order-2 lg:order-1">
            {loading ? (
              <div className="flex min-h-64 flex-col items-center justify-center gap-3 text-text-secondary">
                <PawLoader />
                <p className="text-sm">{t('payment.loading')}</p>
              </div>
            ) : error ? (
              <div className="flex min-h-64 flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed border-gray-200 p-6 text-center">
                <p className="text-sm font-semibold text-status-danger">{error}</p>
                <Link to="/checkout" className="text-sm text-brand-burgundy hover:underline">
                  {t('payment.back')}
                </Link>
              </div>
            ) : (
              <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 p-6 text-center">
                <p className="text-sm font-semibold text-text-secondary">{t('payment.snapSimTitle')}</p>
                <p className="mt-1 max-w-sm text-xs text-text-secondary">{t('payment.snapSimDesc')}</p>
              </div>
            )}

            {/* Dev-only simulation buttons — remove once real Midtrans integration is wired in */}
            <div className="mt-6 grid gap-2 sm:grid-cols-3">
              <Button variant="primary" size="sm" onClick={handleSuccess} disabled={loading || Boolean(error)}>
                {t('payment.simulateSuccess')}
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigate('/pembayaran/gagal')}>
                {t('payment.simulateFailed')}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => navigate('/pembayaran/pending')}>
                {t('payment.simulatePending')}
              </Button>
            </div>
          </Card>

          <Card className="order-1 lg:order-2 h-fit">
            <p className="text-xs uppercase tracking-wide text-text-secondary">{t('payment.orderNumber')}</p>
            <p className="mt-1 font-heading text-lg font-bold text-text-primary">
              {isBooking ? `${t('payment.bookingPrefix')} ${idLabel}` : idLabel}
            </p>
            <p className="mt-4 text-xs uppercase tracking-wide text-text-secondary">{t('payment.totalPaid')}</p>
            <p className="mt-1 font-heading text-2xl font-bold text-brand-burgundy">{formatPrice(total)}</p>
            <div className="mt-4">
              <CountdownTimer deadline={deadline} />
            </div>
            <Link to="/keranjang" className="mt-6 inline-block text-sm text-brand-burgundy hover:underline">
              {t('payment.back')}
            </Link>
          </Card>
        </div>
      </main>
      <WaveDivider topColor="text-brand-cream" bottomColor="bg-brand-burgundy" />
      <Footer />
    </>
  );
}