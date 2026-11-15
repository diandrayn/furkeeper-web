import { useEffect, useState } from 'react';
import { Clock, Copy } from 'lucide-react';
import { useNavigate, useSearchParams } from '@/lib/router';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import WaveDivider from '../components/decorative/WaveDivider';
import PaymentResultLayout from '../components/PaymentResultLayout';
import Button from '../components/Button';
import { fetchPayment, paymentStatusKey, syncPayment } from '../utils/payments';
import { useAuth } from '../hooks/useAuth';
import { formatPrice } from '../utils/validation';
import { useLanguage } from '../i18n/LanguageContext';

const MOCK_VA = '8808 1234 5678 9012';

export default function PaymentPendingPage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [copied, setCopied] = useState(false);
  const [payment, setPayment] = useState(null);
  const [checking, setChecking] = useState(false);
  const [syncError, setSyncError] = useState('');

  const paymentId = params.get('payment') || '';

  useEffect(() => {
    let active = true;
    if (!paymentId || !user?.id) return undefined;
    (async () => {
      try {
        let row = await fetchPayment(paymentId);
        if (!active) return;
        setPayment(row);
        if (row.status === 'pending') {
          try {
            row = await syncPayment(paymentId);
          } catch (err) {
            console.error('PaymentPendingPage sync failed:', err);
            if (active) setSyncError(err?.message || t('payment.statusCheckFailed'));
            return;
          }
          if (!active) return;
          setPayment(row);
        }
        if (row.status === 'paid') {
          navigate(`/pembayaran/sukses?payment=${encodeURIComponent(paymentId)}`, { replace: true });
        } else if (['failed', 'expired'].includes(row.status)) {
          navigate(`/pembayaran/gagal?payment=${encodeURIComponent(paymentId)}`, { replace: true });
        }
      } catch (err) {
        console.error('PaymentPendingPage load failed:', err);
        if (active) setSyncError(err?.message || t('payment.statusCheckFailed'));
      }
    })();
    return () => {
      active = false;
    };
  }, [paymentId, user?.id, navigate, t]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(MOCK_VA.replace(/\s/g, ''));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  const handleCheck = async () => {
    if (!paymentId) {
      window.location.reload();
      return;
    }
    setChecking(true);
    setSyncError('');
    try {
      const row = await syncPayment(paymentId);
      setPayment(row);
      if (row.status === 'paid') {
        navigate(`/pembayaran/sukses?payment=${encodeURIComponent(paymentId)}`, { replace: true });
      } else if (['failed', 'expired'].includes(row.status)) {
        navigate(`/pembayaran/gagal?payment=${encodeURIComponent(paymentId)}`, { replace: true });
      }
    } catch (err) {
      console.error('PaymentPendingPage sync failed:', err);
      setSyncError(err?.message || t('payment.statusCheckFailed'));
    } finally {
      setChecking(false);
    }
  };

  return (
    <>
      <Navbar />
      <PaymentResultLayout
        icon={<Clock className="h-10 w-10" />}
        iconColor="text-status-warning"
        title={t('payment.pendingTitle')}
        description={payment ? t('payment.pendingDescSnap') : t('payment.pendingDesc')}
      >
        {payment ? (
          <div className="rounded-xl bg-brand-cream px-4 py-3 text-left">
            <p className="text-xs text-text-secondary">{t('payment.paymentStatus')}</p>
            <p className="mt-1 font-heading text-lg font-bold text-text-primary">
              {t(paymentStatusKey(payment.status))}
            </p>
            <p className="mt-2 text-xs text-text-secondary">
              {t('payment.orderNumber')}: {payment.orderIds.join(', ')}
            </p>
            <p className="mt-1 text-xs text-text-secondary">
              {t('payment.totalPaid')}: {formatPrice(payment.grossAmount)}
            </p>
            {payment.expiresAt && (
              <p className="mt-1 text-xs text-text-secondary">
                {t('payment.expiresAt')}: {new Date(payment.expiresAt).toLocaleString()}
              </p>
            )}
          </div>
        ) : paymentId ? (
          <p className="rounded-xl bg-brand-cream px-4 py-3 text-left text-sm text-text-secondary">
            {t('payment.loading')}
          </p>
        ) : (
          <div className="rounded-xl bg-brand-cream px-4 py-3 text-left">
            <p className="text-xs text-text-secondary">{t('payment.vaNumber')}</p>
            <div className="mt-1 flex items-center justify-between gap-2">
              <p className="font-heading text-lg font-bold text-text-primary">{MOCK_VA}</p>
              <Button variant="ghost" size="sm" icon={<Copy className="h-4 w-4" />} onClick={handleCopy}>
                {copied ? t('payment.copied') : t('payment.copy')}
              </Button>
            </div>
          </div>
        )}
        {syncError && <p className="mt-3 text-left text-sm text-status-danger">{syncError}</p>}
        <Button variant="outline" className="mt-6" fullWidth onClick={handleCheck} disabled={checking}>
          {checking ? t('payment.checking') : t('payment.checkStatus')}
        </Button>
      </PaymentResultLayout>
      <WaveDivider topColor="text-brand-cream" bottomColor="bg-brand-burgundy" />
      <Footer />
    </>
  );
}
