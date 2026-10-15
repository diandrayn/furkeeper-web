import { useState } from 'react';
import { Link } from '@/lib/router';
import AuthCard from '../components/AuthCard';
import AuthHeader from '../components/AuthHeader';
import AuthPageShell from '../components/AuthPageShell';
import PasswordInput from '../components/PasswordInput';
import Button from '../components/Button';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../i18n/LanguageContext';

export default function ResetPasswordPage() {
  const { resetPassword, isLoggedIn, isLoading } = useAuth();
  const { t } = useLanguage();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [fieldError, setFieldError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [status, setStatus] = useState('idle'); // 'idle' | 'submitting' | 'done'

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    if (!password) {
      setFieldError(t('auth.resetPassword.errorPasswordRequired'));
      return;
    }
    if (password.length < 6) {
      setFieldError(t('auth.resetPassword.errorPasswordWeak'));
      return;
    }
    if (password !== confirm) {
      setFieldError(t('auth.resetPassword.errorPasswordMismatch'));
      return;
    }
    setFieldError('');
    setStatus('submitting');
    try {
      await resetPassword(password);
      setStatus('done');
    } catch (err) {
      setSubmitError(err.message || t('auth.resetPassword.errorUpdate'));
      setStatus('idle');
    }
  };

  // The e-mail link lands here with a recovery session that Supabase
  // restores via detectSessionInUrl. Until the session resolves we must
  // not conclude the link is invalid, so wait for isLoading to finish.
  if (!isLoading && !isLoggedIn && status !== 'done') {
    return (
      <AuthPageShell tone="burgundy">
        <AuthCard>
          <AuthHeader title={t('auth.resetPassword.title')} />
          <div className="space-y-4">
            <div
              className="rounded-xl bg-status-danger/10 px-4 py-3 text-sm text-status-danger"
              role="alert"
            >
              {t('auth.resetPassword.expiredHint')}
            </div>
            <p className="text-center text-sm text-text-secondary">
              <Link
                to="/forgot-password"
                className="font-medium text-brand-burgundy transition-colors duration-200 hover:underline"
              >
                {t('auth.forgotPassword.backToLogin')}
              </Link>
            </p>
          </div>
        </AuthCard>
      </AuthPageShell>
    );
  }

  return (
    <AuthPageShell tone="burgundy">
      <AuthCard>
        <AuthHeader title={t('auth.resetPassword.title')} subtitle={t('auth.resetPassword.subtitle')} />

        {status === 'done' ? (
          <div className="space-y-4">
            <div className="rounded-xl bg-status-success/10 px-4 py-3 text-sm text-text-primary">
              {t('auth.resetPassword.successSubtitle')}
            </div>
            <Link to="/login">
              <Button variant="orange" fullWidth>
                {t('auth.resetPassword.backToLogin')}
              </Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <PasswordInput
              label={t('auth.resetPassword.newPasswordLabel')}
              name="newPassword"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={status === 'idle' && fieldError && !confirm ? fieldError : undefined}
              required
              autoComplete="new-password"
            />

            <PasswordInput
              label={t('auth.resetPassword.confirmPasswordLabel')}
              name="confirmPassword"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              error={fieldError && confirm ? fieldError : undefined}
              required
              autoComplete="new-password"
            />

            {submitError && (
              <div
                className="rounded-xl bg-status-danger/10 px-4 py-3 text-sm text-status-danger"
                role="alert"
              >
                {submitError}
              </div>
            )}

            <Button type="submit" variant="orange" fullWidth loading={status === 'submitting'}>
              {t('auth.resetPassword.buttonLabel')}
            </Button>
          </form>
        )}
      </AuthCard>
    </AuthPageShell>
  );
}