import { useEffect, useRef, useState } from 'react';
import { Clock, XCircle } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from '@/lib/router';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import WaveDivider from '../components/decorative/WaveDivider';
import PaymentResultLayout from '../components/PaymentResultLayout';
import Button from '../components/Button';
import { fetchPayment, paymentStatusKey, syncPayment } from '../utils/payments';
import { useAuth } from '../hooks/useAuth';
import { useCart } from '../context/CartContext';
import { formatPrice } from '../utils/validation';
import { useLanguage } from '../i18n/LanguageContext';

export default function PaymentFailedPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { user } = useAuth();
  const { restoreCheckoutSnapshot } = useCart();
  const restoreSnapshotRef = useRef(restoreCheckoutSnapshot);
  const [params] = useSearchParams();
  const [payment, setPayment] = useState(null);
  const [restored, setRestored] = useState(false);
  const [checking, setChecking] = useState(false);
  const [syncError, setSyncError] = useState('');

  const paymentId = params.get('payment') || '';
  const loading = Boolean(paymentId && !payment && !syncError);

  useEffect(() => {
    restoreSnapshotRef.current = restoreCheckoutSnapshot;
  }, [restoreCheckoutSnapshot]);

  useEffect(() => {
    let active = true;
    if (!paymentId || !user?.id) return undefined;
    (async () => {
      try {
        let row = await fetchPayment(paymentId);
        if (!active) return;
        setPayment(row);
        // The Snap error callback is not authoritative; ask Midtrans so we
        // only restore the cart when the payment really failed/expired.
        if (row.status === 'pending') {
          try {
            row = await syncPayment(paymentId);
          } catch (err) {
            console.error('PaymentFailedPage sync failed:', err);
            if (active) setSyncError(err?.message || t('payment.statusCheckFailed'));
            return;
          }
          if (!active) return;
          setPayment(row);
        }
        if (row.status === 'paid') {
          navigate(`/pembayaran/sukses?payment=${encodeURIComponent(paymentId)}`, { replace: true });
        }
      } catch (err) {
        console.error('PaymentFailedPage load failed:', err);
        if (active) setSyncError(err?.message || t('payment.statusCheckFailed'));
      }
    })();
    return () => {
      active = false;
    };
  }, [paymentId, user?.id, navigate, t]);

  const orderId = payment?.orderIds?.[0];
  const confirmedFailure = !paymentId || ['failed', 'expired'].includes(payment?.status);
  const needsVerification =
    Boolean(paymentId) && (!payment || ['pending', 'challenge'].includes(payment.status));
  const isRefunded = payment?.status === 'refunded';

  const handleCheckStatus = async () => {
    if (!paymentId) return;
    setChecking(true);
    setSyncError('');
    try {
      const row = await syncPayment(paymentId);
      setPayment(row);
      if (row.status === 'paid') {
        navigate(`/pembayaran/sukses?payment=${encodeURIComponent(paymentId)}`, { replace: true });
      }
    } catch (err) {
      console.error('PaymentFailedPage status check failed:', err);
      setSyncError(err?.message || t('payment.statusCheckFailed'));
    } finally {
      setChecking(false);
    }
  };

  const handleRetry = () => {
    if (orderId) navigate(`/pembayaran/${encodeURIComponent(orderId)}`);
    else navigate('/keranjang');
  };

  const handleRestoreCart = () => {
    const count = restoreSnapshotRef.current();
    setRestored(Boolean(count));
  };

  return (
    <>
      <Navbar />
      <PaymentResultLayout
        icon={
          loading || needsVerification
            ? <Clock className="h-10 w-10" />
            : <XCircle className="h-10 w-10" />
        }
        iconColor={loading || needsVerification ? 'text-status-warning' : 'text-status-danger'}
        title={
          loading || needsVerification
            ? t('payment.verifyingTitle')
            : isRefunded
              ? t('payment.statusRefunded')
              : confirmedFailure
                ? t('payment.failedTitle')
                : t('payment.verifyingTitle')
        }
        description={
          loading || needsVerification
            ? t('payment.verifyingDesc')
            : isRefunded
              ? t('payment.refundedDesc')
              : confirmedFailure
                ? t(payment?.status === 'expired' ? 'payment.expiredDesc' : 'payment.failedDesc')
                : t('payment.verifyingDesc')
        }
      >
        {payment && (
          <div className="rounded-xl bg-brand-cream px-4 py-3 text-left">
            <p className="text-xs text-text-secondary">{t('payment.paymentStatus')}</p>
            <p className="mt-1 font-heading text-lg font-bold text-text-primary">
              {t(paymentStatusKey(payment.status))}
            </p>
            <p className="text-xs text-text-secondary">{t('payment.orderNumber')}</p>
            <p className="mt-1 font-heading text-lg font-bold text-text-primary">
              {payment.orderIds.join(', ')}
            </p>
            <p className="mt-2 text-xs text-text-secondary">
              {t('payment.totalPaid')}: {formatPrice(payment.grossAmount)}
            </p>
          </div>
        )}
        {restored && (
          <p className="mt-4 rounded-xl bg-status-success/10 px-4 py-3 text-left text-sm font-medium text-status-success">
            {t('payment.cartRestored')}
          </p>
        )}
        {syncError && <p className="mt-4 text-left text-sm text-status-danger">{syncError}</p>}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          {confirmedFailure && !isRefunded && (
            <Button
              variant="primary"
              className="flex-1"
              onClick={handleRetry}
              disabled={loading}
            >
              {t('payment.retryPay')}
            </Button>
          )}
          {needsVerification && (
            <Button
              variant="primary"
              className="flex-1"
              onClick={handleCheckStatus}
              loading={checking}
            >
              {checking ? t('payment.checking') : t('payment.checkStatus')}
            </Button>
          )}
          {orderId ? (
            <Link to={`/pesanan/${orderId}`} className="flex-1">
              <Button variant="outline" fullWidth>
                {t('payment.viewOrder')}
              </Button>
            </Link>
          ) : (
            <Link to="/keranjang" className="flex-1">
              <Button variant="outline" fullWidth>
                {t('payment.backToCart')}
              </Button>
            </Link>
          )}
        </div>
        {confirmedFailure && !isRefunded && !restored && (
          <Button variant="ghost" size="sm" className="mt-3" onClick={handleRestoreCart}>
            {t('payment.restoreToCart')}
          </Button>
        )}
      </PaymentResultLayout>
      <WaveDivider topColor="text-brand-cream" bottomColor="bg-brand-burgundy" />
      <Footer />
    </>
  );
}
