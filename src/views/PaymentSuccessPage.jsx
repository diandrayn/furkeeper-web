import { useEffect, useState } from 'react';
import { Link, useSearchParams } from '@/lib/router';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import WaveDivider from '../components/decorative/WaveDivider';
import PaymentResultLayout from '../components/PaymentResultLayout';
import Button from '../components/Button';
import ImagePlaceholder from '../components/ImagePlaceholder';
import { fetchOrderById } from '../utils/orders';
import { fetchBookingById } from '../utils/bookings';
import { fetchPayment, syncPayment } from '../utils/payments';
import { useAuth } from '../hooks/useAuth';
import { useCart } from '../context/CartContext';
import { formatPrice } from '../utils/validation';
import { useLanguage } from '../i18n/LanguageContext';

export default function PaymentSuccessPage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { clearCheckoutSnapshot } = useCart();
  const [params] = useSearchParams();
  const [order, setOrder] = useState(null);
  const [booking, setBooking] = useState(null);
  const [payment, setPayment] = useState(null);

  const paymentId = params.get('payment') || '';
  const rawId = params.get('order') || '';
  const kind = params.get('kind') || 'order';

  useEffect(() => {
    let active = true;
    if (!paymentId || !user?.id) return undefined;
    (async () => {
      try {
        let row = await fetchPayment(paymentId);
        if (!active) return;
        setPayment(row);
        // The Snap callback can arrive before the webhook. Ask Midtrans for
        // the authoritative status so this page never shows a false success.
        if (row.status === 'pending') {
          try {
            row = await syncPayment(paymentId);
          } catch (err) {
            // Keep the pending row; the page will show "verifying" instead of
            // claiming a success we have not confirmed.
            console.error('PaymentSuccessPage sync failed:', err);
            return;
          }
          if (active) setPayment(row);
        }
      } catch (err) {
        console.error('PaymentSuccessPage payment load failed:', err);
      }
    })();
    return () => {
      active = false;
    };
  }, [paymentId, user?.id]);

  // Payment is authoritative: only discard the checkout snapshot once the
  // payment is actually paid, never on the Snap callback alone.
  useEffect(() => {
    if (payment?.status === 'paid') clearCheckoutSnapshot();
  }, [payment?.status, clearCheckoutSnapshot]);

  useEffect(() => {
    let active = true;
    if (!rawId || !user?.id || paymentId) return undefined;
    (async () => {
      try {
        if (kind === 'booking') {
          const b = await fetchBookingById(user.id, rawId);
          if (active) setBooking(b);
        } else {
          const o = await fetchOrderById(user.id, rawId);
          if (active) setOrder(o);
        }
      } catch (err) {
        console.error('PaymentSuccessPage load failed:', err);
      }
    })();
    return () => {
      active = false;
    };
  }, [rawId, kind, user?.id, paymentId]);

  const target = booking || order;
  const total = payment?.grossAmount ?? booking?.price ?? order?.totalPrice ?? 0;
  const orderId = payment?.orderIds?.[0] || target?.id;
  const detailLink = payment
    ? orderId
      ? `/pesanan/${orderId}`
      : '/profil/riwayat'
    : booking
      ? `/booking/${booking.id}/status`
      : order
        ? `/pesanan/${order.id}`
        : '/profil/riwayat';
  const stillVerifying = Boolean(payment) && payment.status !== 'paid';

  return (
    <>
      <Navbar />
      <PaymentResultLayout
        illustration={
          <ImagePlaceholder
            className="h-24 w-24 rounded-2xl"
            alt="Ilustrasi pembayaran berhasil — ganti dengan foto asli"
          />
        }
        title={stillVerifying ? t('payment.verifyingTitle') : t('payment.successTitle')}
        description={
          stillVerifying
            ? t('payment.verifyingDesc')
            : orderId || target
              ? t('payment.successDescWithOrder')
                  .replace('{order}', orderId || target.id)
                  .replace('{total}', formatPrice(total))
              : t('payment.successDescDefault')
        }
      >
        <Link to={detailLink}>
          <Button variant="primary" fullWidth>
            {t('payment.viewOrder')}
          </Button>
        </Link>
      </PaymentResultLayout>
      <WaveDivider topColor="text-brand-cream" bottomColor="bg-brand-burgundy" />
      <Footer />
    </>
  );
}
