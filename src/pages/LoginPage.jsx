import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import AuthCard from '../components/AuthCard';
import AuthHeader from '../components/AuthHeader';
import AuthPageShell from '../components/AuthPageShell';
import Input from '../components/Input';
import PasswordInput from '../components/PasswordInput';
import Button from '../components/Button';
import Divider from '../components/Divider';
import { isValidEmailOrPhone } from '../utils/validation';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../i18n/LanguageContext';

function GoogleIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginWithGoogle, loginWithPassword, resendConfirmation } = useAuth();
  const { t } = useLanguage();
  const [googleError, setGoogleError] = useState('');
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
      await resendConfirmation(emailNotConfirmed);
      setResendNotice(t('auth.login.confirmLinkSent'));
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
    } else if (!isValidEmailOrPhone(emailOrPhone)) {
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
          // role is seller/service but neither status is set — an
          // inconsistent/legacy account (see
          // supabase/diagnostic_partner_status.sql). Don't send it to
          // /status-pengajuan (it would just bounce back here) or loop
          // through DashboardRoute; surface it on the homepage instead.
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

  const handleGoogleLogin = async () => {
    setGoogleError('');
    try {
      // This redirects the whole page to Google and back — there's no user
      // to navigate with here, the session is picked up by AuthContext
      // once the browser lands back on the app.
      await loginWithGoogle();
    } catch (err) {
      setGoogleError(err.message || t('auth.login.errorGoogle'));
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
            value={emailOrPhone}
            onChange={(e) => setEmailOrPhone(e.target.value)}
            onBlur={() => validate()}
            error={errors.emailOrPhone}
            required
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

        <Divider text={t('auth.login.or')} />

        {googleError && (
          <div
            className="mb-3 rounded-xl bg-status-danger/10 px-4 py-3 text-sm text-status-danger"
            role="alert"
          >
            {googleError}
          </div>
        )}

        <Button variant="outline" fullWidth icon={<GoogleIcon />} onClick={handleGoogleLogin}>
          {t('auth.login.googleContinue')}
        </Button>

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
