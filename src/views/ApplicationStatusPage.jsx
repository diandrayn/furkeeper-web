import { Link, Navigate } from '@/lib/router';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import WaveDivider from '../components/decorative/WaveDivider';
import PendingApplicationBanner from '../components/PendingApplicationBanner';
import Stepper from '../components/Stepper';
import Badge from '../components/Badge';
import Button from '../components/Button';
import PawLoader from '../components/decorative/PawLoader';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../i18n/LanguageContext';

function statusToStep(status) {
  if (status === 'active' || status === 'rejected') return 3;
  if (status === 'pending') return 2;
  return 1;
}

function formatDate(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return '—';
  }
}

function ApplicationCard({ title, status, submittedAt, t }) {
  if (!status || status === 'none') return null;

  const STATUS_STEPS = [t('applicationStatus.stepSubmitted'), t('applicationStatus.stepReviewed'), t('applicationStatus.stepDecision')];
  const badge =
    status === 'pending'
      ? { variant: 'pending', label: t('applicationStatus.pendingApproval') }
      : status === 'active'
        ? { variant: 'active', label: t('applicationStatus.active') }
        : { variant: 'rejected', label: t('applicationStatus.rejected') };

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="font-heading text-lg font-bold text-text-primary">{title}</h2>
        <Badge variant={badge.variant} label={badge.label} />
      </div>
      <Stepper steps={3} current={statusToStep(status)} labels={STATUS_STEPS} />
      <dl className="mt-6 space-y-2 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-text-secondary">{t('applicationStatus.submittedDate')}</dt>
          <dd className="font-medium text-text-primary">{formatDate(submittedAt)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-text-secondary">{t('applicationStatus.reviewEstimate')}</dt>
          <dd className="font-medium text-text-primary">{t('applicationStatus.reviewEstimateValue')}</dd>
        </div>
      </dl>
      {status === 'rejected' && (
        <Link to="/pengajuan-ulang" className="mt-6 block">
          <Button variant="orange" fullWidth>
            {t('applicationStatus.resubmit')}
          </Button>
        </Link>
      )}
      {status === 'active' && (
        <Link to={title === t('applicationStatus.storeApplication') ? '/dashboard/toko' : '/dashboard/jasa'} className="mt-6 block">
          <Button variant="orange" fullWidth>
            {t('applicationStatus.openDashboard')}
          </Button>
        </Link>
      )}
    </div>
  );
}

// This page is only for an account that currently has a *pending* or
// *rejected* mitra application — see supabase/schema.sql's
// seller_status/provider_status values and AuthContext's normalizeUser()
// (which maps the DB's 'approved' to 'active' here in the app). An
// approved account is sent straight to its dashboard instead, and an
// account with no application at all (buyers included) is sent home;
// there is no "register as partner" call-to-action here anymore — that
// lives on /register.
export default function ApplicationStatusPage() {
  const { t } = useLanguage();
  const { user, isLoggedIn, isLoading } = useAuth();

  if (isLoading) {
    return <PawLoader label="Memuat..." />;
  }

  const sellerStatus = user?.sellerStatus || 'none';
  const providerStatus = user?.providerStatus || 'none';

  const hasApprovedApplication = isLoggedIn && (sellerStatus === 'active' || providerStatus === 'active');
  const hasPendingOrRejected =
    isLoggedIn &&
    (sellerStatus === 'pending' ||
      sellerStatus === 'rejected' ||
      providerStatus === 'pending' ||
      providerStatus === 'rejected');

  if (hasApprovedApplication) {
    return <Navigate to={sellerStatus === 'active' ? '/dashboard/toko' : '/dashboard/jasa'} replace />;
  }

  if (!hasPendingOrRejected) {
    return <Navigate to="/" replace />;
  }

  return (
    <>
      <Navbar />
      <PendingApplicationBanner />
      <main className="mx-auto max-w-container px-4 py-10 md:px-6 lg:px-8">
        <h1 className="font-heading text-2xl font-bold text-text-primary">{t('applicationStatus.title')}</h1>
        <p className="mt-1 text-sm text-text-secondary">
          {t('applicationStatus.subtitle')}
        </p>

        <div className="mt-8 space-y-4">
          <ApplicationCard
            title={t('applicationStatus.storeApplication')}
            status={sellerStatus}
            submittedAt={user.partnerSubmittedAt}
            t={t}
          />
          <ApplicationCard
            title={t('applicationStatus.serviceApplication')}
            status={providerStatus}
            submittedAt={user.partnerSubmittedAt}
            t={t}
          />
        </div>
      </main>
      <WaveDivider topColor="text-brand-cream" bottomColor="bg-brand-burgundy" />
      <Footer />
    </>
  );
}
