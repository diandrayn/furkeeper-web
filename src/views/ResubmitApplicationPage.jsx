import { Link } from '@/lib/router';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import WaveDivider from '../components/decorative/WaveDivider';
import Button from '../components/Button';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../i18n/LanguageContext';

export default function ResubmitApplicationPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const type = user?.sellerStatus === 'rejected' ? 'seller' : 'service';

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-lg px-4 py-12 md:px-6">
        <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
          <h1 className="font-heading text-2xl font-bold text-text-primary">{t('applicationStatus.rejectedTitle')}</h1>
          <p className="mt-3 text-sm text-text-secondary">
            {t('applicationStatus.rejectedIntro')}
          </p>
          <p className="mt-4 rounded-xl bg-status-danger/10 px-4 py-3 text-sm text-status-danger">
            {t('applicationStatus.rejectedReason')}
          </p>
          <Link to={`/register/partner?type=${type}`} className="mt-8 block">
            <Button variant="orange" fullWidth>
              {t('applicationStatus.resubmit')}
            </Button>
          </Link>
        </div>
      </main>
      <WaveDivider topColor="text-brand-cream" bottomColor="bg-brand-burgundy" />
      <Footer />
    </>
  );
}
