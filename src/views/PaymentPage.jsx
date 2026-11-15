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
import { createPayment } from '../utils/payments';
import { openSnap } from '../utils/snap';
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
  const [payment, setPayment] = useState(null);
  const [processed, setProcessed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [payError, setPayError] = useState('');
  const [paying, setPaying] = useState(false);
  const [fallbackDeadline] = useState(() => Date.now() + 24 * 60 * 60 * 1000);

  useEffect(() => {
    let active = true;
    const orderIds = (orderId || '').split(',').filter(Boolean);

    (async () => {
      setLoading(true);
      setError('');
      setPayment(null);
      setProcessed(false);
      setIsBooking(false);

      try {
        let orderRows = [];
        let foundBooking = null;

        if (orderIds.length > 1) {
          orderRows = await fetchOrdersByIds(user?.id, orderIds);
        } else if (orderIds.length === 1) {
          const row = await fetchOrderById(user?.id, orderIds[0]);
          if (row) orderRows = [row];
          else foundBooking = await fetchBookingById(user?.id, orderIds[0]);
        }

        if (!active) return;

        if (foundBooking) {
          setBooking(foundBooking);
          setIsBooking(true);
          return;
        }

        if (!orderRows.length) {
          setError(t('payment.orderNotFound'));
          return;
        }

        setOrders(orderRows);

        if (orderRows.every((order) => order.status === 'pending_payment')) {
          // Creates (or reuses) one payment covering every order in this
          // checkout, then returns the Snap token for the popup.
          const created = await createPayment(orderRows.map((order) => order.id));
          if (active) setPayment(created);
        } else {
          setProcessed(true);
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

  const total = isBooking
    ? booking?.price || 0
    : orders.reduce((sum, o) => sum + (o.totalPrice || 0), 0);
  const idLabel = isBooking ? booking?.id || ids[0] : orders[0]?.id || ids[0];
  const deadline = payment?.expiresAt || fallbackDeadline;

  const handlePay = async () => {
    if (!payment?.snapToken) return;
    setPaying(true);
    setPayError('');
    try {
      await openSnap(payment.snapToken, {
        onSuccess: () => navigate(`/pembayaran/sukses?payment=${encodeURIComponent(payment.id)}`),
        onPending: () => navigate(`/pembayaran/pending?payment=${encodeURIComponent(payment.id)}`),
        onError: () => navigate(`/pembayaran/gagal?payment=${encodeURIComponent(payment.id)}`),
        onClose: () => {
          setPaying(false);
          setPayError(t('payment.snapClosed'));
        },
      });
    } catch (err) {
      console.error('Snap pay failed:', err);
      setPayError(err?.message || t('payment.snapLoadFailed'));
    } finally {
      setPaying(false);
    }
  };

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
            ) : processed ? (
              <div className="flex min-h-64 flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed border-gray-200 p-6 text-center">
                <p className="text-sm font-semibold text-text-secondary">{t('payment.alreadyProcessed')}</p>
                <Link
                  to={`/pesanan/${encodeURIComponent(orders[0]?.id || idLabel)}`}
                  className="text-sm text-brand-burgundy hover:underline"
                >
                  {t('payment.viewOrders')}
                </Link>
              </div>
            ) : isBooking ? (
              <>
                <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 p-6 text-center">
                  <p className="text-sm font-semibold text-text-secondary">{t('payment.snapSimTitle')}</p>
                  <p className="mt-1 max-w-sm text-xs text-text-secondary">{t('payment.snapSimDesc')}</p>
                </div>

                {/* Booking payments still use the simulation flow. */}
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
              </>
            ) : (
              <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 p-6 text-center">
                <p className="text-sm font-semibold text-text-secondary">{t('payment.snapTitle')}</p>
                <p className="mt-1 max-w-md text-xs text-text-secondary">{t('payment.snapDesc')}</p>
                <Button
                  variant="primary"
                  className="mt-5"
                  onClick={handlePay}
                  disabled={!payment?.snapToken || paying}
                >
                  {!payment?.snapToken || paying ? t('payment.preparingPayment') : t('payment.payNow')}
                </Button>
                {payError && <p className="mt-3 text-xs text-status-danger">{payError}</p>}
                {payError && payment?.id && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={() => navigate(`/pembayaran/pending?payment=${encodeURIComponent(payment.id)}`)}
                  >
                    {t('payment.checkStatus')}
                  </Button>
                )}
                {payment?.snapRedirectUrl && (
                  <a
                    href={payment.snapRedirectUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 text-xs text-brand-burgundy hover:underline"
                  >
                    {t('payment.openNewTab')}
                  </a>
                )}
              </div>
            )}
          </Card>

          <Card className="order-1 lg:order-2 h-fit">
            <p className="text-xs uppercase tracking-wide text-text-secondary">{t('payment.orderNumber')}</p>
            <p className="mt-1 font-heading text-lg font-bold text-text-primary">
              {isBooking ? `${t('payment.bookingPrefix')} ${idLabel}` : idLabel}
            </p>
            {!isBooking && orders.length > 1 && (
              <p className="mt-1 text-xs text-text-secondary">
                {t('payment.orderCount').replace('{count}', String(orders.length))}
              </p>
            )}
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
