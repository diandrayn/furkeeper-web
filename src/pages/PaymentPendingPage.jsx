import { useState } from 'react';
import { Clock, Copy } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import WaveDivider from '../components/decorative/WaveDivider';
import PaymentResultLayout from '../components/PaymentResultLayout';
import Button from '../components/Button';
import { useLanguage } from '../i18n/LanguageContext';

const MOCK_VA = '8808 1234 5678 9012';

export default function PaymentPendingPage() {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(MOCK_VA.replace(/\s/g, ''));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <>
      <Navbar />
      <PaymentResultLayout
        icon={<Clock className="h-10 w-10" />}
        iconColor="text-status-warning"
        title={t('payment.pendingTitle')}
        description={t('payment.pendingDesc')}
      >
        <div className="rounded-xl bg-brand-cream px-4 py-3 text-left">
          <p className="text-xs text-text-secondary">{t('payment.vaNumber')}</p>
          <div className="mt-1 flex items-center justify-between gap-2">
            <p className="font-heading text-lg font-bold text-text-primary">{MOCK_VA}</p>
            <Button variant="ghost" size="sm" icon={<Copy className="h-4 w-4" />} onClick={handleCopy}>
              {copied ? t('payment.copied') : t('payment.copy')}
            </Button>
          </div>
        </div>
        <Button variant="outline" className="mt-6" fullWidth onClick={() => window.location.reload()}>
          {t('payment.checkStatus')}
        </Button>
      </PaymentResultLayout>
      <WaveDivider topColor="text-brand-cream" bottomColor="bg-brand-burgundy" />
      <Footer />
    </>
  );
}
