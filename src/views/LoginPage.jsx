import { useState } from 'react';
import { Link, useLocation, useNavigate } from '@/lib/router';
import AuthCard from '../components/AuthCard';
import AuthHeader from '../components/AuthHeader';
import AuthPageShell from '../components/AuthPageShell';
import Input from '../components/Input';
import PasswordInput from '../components/PasswordInput';
import Button from '../components/Button';
import { isValidEmail } from '../utils/validation';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../i18n/LanguageContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginWithPassword, resendConfirmation } = useAuth();
  const { t } = useLanguage();
  const from = location.state?.from;
  const redirectTo = from ? `${from.pathname || '/'}${from.search || ''}` : '/';
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [authError, setAuthError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Set to the entered e-mail when login fails with "email not confirmed"
  // (see friendlyLoginError in utils/api.js → status 428), so we can offer
  // a "resend the verification link" action instead of a dead end.
  const [emailNotConfirmed, setEmailNotConfirmed] = useState('');
  const [resendNotice, setResendNotice] = useState('');
  const [isResending, setIsResending] = useState(false);

  const handleResendConfirmation = async () => {
    if (!emailNotConfirmed) return;
    setResendNotice('');
    setIsResending(true);
    try {
      const result = await resendConfirmation(emailNotConfirmed);
      setResendNotice(
        result.emailSent
          ? t('auth.login.confirmLinkSent')
          : t('auth.login.confirmLinkNotSent'),
      );
    } catch (err) {
      setResendNotice(err.message || t('auth.login.resendFailed'));
    } finally {
      setIsResending(false);
    }
  };

  const validate = () => {
    const next = {};
    if (!emailOrPhone.trim()) {
      next.emailOrPhone = t('auth.login.errorEmailOrPhoneRequired');
    } else if (!isValidEmail(emailOrPhone)) {
      next.emailOrPhone = t('auth.login.errorEmailOrPhoneInvalid');
    }
    if (!password) {
      next.password = t('auth.login.errorPasswordRequired');
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const user = await loginWithPassword({ emailOrPhone: emailOrPhone.trim(), password });
      setEmailNotConfirmed('');
      setResendNotice('');
      // Route based on the profiles-sourced status returned above (never
      // on the raw seller/service role alone), so an approved mitra lands
      // straight on their dashboard instead of bouncing through
      // /status-pengajuan.
      if (user.role === 'admin') {
        navigate(redirectTo !== '/' ? redirectTo : '/admin', { replace: true });
      } else if (user.role === 'seller' || user.role === 'service') {
        if (user.sellerStatus === 'active' || user.providerStatus === 'active') {
          const target = user.sellerStatus === 'active' ? '/dashboard/toko' : '/dashboard/jasa';
          navigate(redirectTo !== '/' ? redirectTo : target, { replace: true });
        } else if (
          user.sellerStatus === 'pending' ||
          user.sellerStatus === 'rejected' ||
          user.providerStatus === 'pending' ||
          user.providerStatus === 'rejected'
        ) {
          navigate(redirectTo !== '/' ? redirectTo : '/status-pengajuan', { replace: true });
        } else {
          // An inconsistent/legacy partner account should not loop through
          // the application status route or DashboardRoute.
          navigate('/', { replace: true, state: { partnerStatusMissing: true } });
        }
      } else {
        navigate(redirectTo, { replace: true });
      }
    } catch (err) {
      setAuthError(err.message || t('auth.login.errorInvalidCredentials'));
      setEmailNotConfirmed(err.status === 428 ? emailOrPhone.trim() : '');
      setResendNotice('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthPageShell tone="burgundy">
      <AuthCard>
        <AuthHeader title={t('auth.login.title')} />

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <Input
            label={t('auth.login.emailOrPhoneLabel')}
            name="emailOrPhone"
            type="email"
            value={emailOrPhone}
            onChange={(e) => setEmailOrPhone(e.target.value)}
            onBlur={() => validate()}
            error={errors.emailOrPhone}
            required
            autoComplete="email"
          />

          <PasswordInput
            label={t('auth.login.passwordLabel')}
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onBlur={() => validate()}
            error={errors.password}
            required
          />

          <div className="text-right">
            <Link
              to="/forgot-password"
              className="text-xs font-medium text-brand-burgundy transition-colors duration-200 hover:underline"
            >
              {t('auth.login.forgotPassword')}
            </Link>
          </div>

          {authError && (
            <div
              className="rounded-xl bg-status-danger/10 px-4 py-3 text-sm text-status-danger"
              role="alert"
            >
              {authError}
            </div>
          )}

          {emailNotConfirmed && (
            <div className="space-y-2 rounded-xl bg-brand-cream px-4 py-3 text-sm">
              <p className="text-text-secondary">{t('auth.login.emailNotConfirmedHint')}</p>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleResendConfirmation}
                  disabled={isResending}
                  className="text-xs font-semibold text-brand-burgundy transition-colors duration-200 hover:underline disabled:opacity-60"
                >
                  {isResending ? '…' : t('auth.login.resendConfirmLink')}
                </button>
                {resendNotice && <span className="text-xs text-status-success">{resendNotice}</span>}
              </div>
            </div>
          )}

          <Button type="submit" variant="orange" fullWidth loading={isSubmitting}>
            {t('auth.login.submit')}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-text-secondary">
          {t('auth.login.noAccount')}{' '}
          <Link
            to="/register"
            className="font-medium text-brand-burgundy transition-colors duration-200 hover:underline"
          >
            {t('auth.login.registerLink')}
          </Link>
        </p>
      </AuthCard>
    </AuthPageShell>
  );
}
