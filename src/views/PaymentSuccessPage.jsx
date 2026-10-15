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
import { useAuth } from '../hooks/useAuth';
import { formatPrice } from '../utils/validation';
import { useLanguage } from '../i18n/LanguageContext';

export default function PaymentSuccessPage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [params] = useSearchParams();
  const [order, setOrder] = useState(null);
  const [booking, setBooking] = useState(null);

  const rawId = params.get('order') || '';
  const kind = params.get('kind') || 'order';

  useEffect(() => {
    let active = true;
    if (!rawId || !user?.id) return undefined;
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
  }, [rawId, kind, user?.id]);

  const target = booking || order;
  const total = booking?.price || order?.totalPrice || 0;
  const detailLink = booking ? `/booking/${booking.id}/status` : order ? `/pesanan/${order.id}` : '/profil/riwayat';

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
        title={t('payment.successTitle')}
        description={
          target
            ? t('payment.successDescWithOrder').replace('{order}', target.id).replace('{total}', formatPrice(total))
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