import { XCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import WaveDivider from '../components/decorative/WaveDivider';
import PaymentResultLayout from '../components/PaymentResultLayout';
import Button from '../components/Button';
import { useLanguage } from '../i18n/LanguageContext';

export default function PaymentFailedPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <>
      <Navbar />
      <PaymentResultLayout
        icon={<XCircle className="h-10 w-10" />}
        iconColor="text-status-danger"
        title={t('payment.failedTitle')}
        description={t('payment.failedDesc')}
      >
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            variant="primary"
            className="flex-1"
            onClick={() => navigate('/checkout')}
          >
            {t('payment.tryAgain')}
          </Button>
          <Link to="/keranjang" className="flex-1">
            <Button variant="outline" fullWidth>
              {t('payment.backToCart')}
            </Button>
          </Link>
        </div>
      </PaymentResultLayout>
      <WaveDivider topColor="text-brand-cream" bottomColor="bg-brand-burgundy" />
      <Footer />
    </>
  );
}
