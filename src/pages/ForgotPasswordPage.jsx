import { useState } from 'react';
import { Link } from 'react-router-dom';
import AuthCard from '../components/AuthCard';
import AuthHeader from '../components/AuthHeader';
import AuthPageShell from '../components/AuthPageShell';
import Input from '../components/Input';
import Button from '../components/Button';
import { isValidEmail } from '../utils/validation';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../i18n/LanguageContext';

export default function ForgotPasswordPage() {
  const { requestPasswordReset } = useAuth();
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [fieldError, setFieldError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [status, setStatus] = useState('idle'); // 'idle' | 'sending' | 'sent'
  const [sentTo, setSentTo] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    if (!email.trim()) {
      setFieldError(t('auth.forgotPassword.errorEmailRequired'));
      return;
    }
    if (!isValidEmail(email)) {
      setFieldError(t('auth.login.errorEmailOrPhoneInvalid'));
      return;
    }
    setFieldError('');
    setStatus('sending');
    try {
      await requestPasswordReset(email.trim());
      setSentTo(email.trim());
      setStatus('sent');
    } catch (err) {
      setSubmitError(err.message || t('auth.forgotPassword.errorSend'));
      setStatus('idle');
    }
  };

  return (
    <AuthPageShell tone="burgundy">
      <AuthCard>
        <AuthHeader title={t('auth.forgotPassword.title')} subtitle={t('auth.forgotPassword.subtitle')} />

        {status === 'sent' ? (
          <div className="space-y-4">
            <div className="rounded-xl bg-status-success/10 px-4 py-3 text-sm text-text-primary">
              {t('auth.forgotPassword.successSubtitle')}{' '}
              <span className="font-semibold">{sentTo}</span>
            </div>
            <Button variant="outline" fullWidth onClick={() => setStatus('idle')}>
              {t('auth.forgotPassword.sendAgain')}
            </Button>
            <p className="text-center text-sm text-text-secondary">
              <Link
                to="/login"
                className="font-medium text-brand-burgundy transition-colors duration-200 hover:underline"
              >
                {t('auth.forgotPassword.backToLogin')}
              </Link>
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <Input
              label={t('auth.forgotPassword.emailLabel')}
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => {
                if (email && !isValidEmail(email)) setFieldError(t('auth.login.errorEmailOrPhoneInvalid'));
                else if (!email) setFieldError('');
              }}
              error={fieldError}
              required
              autoComplete="email"
            />

            {submitError && (
              <div
                className="rounded-xl bg-status-danger/10 px-4 py-3 text-sm text-status-danger"
                role="alert"
              >
                {submitError}
              </div>
            )}

            <Button type="submit" variant="orange" fullWidth loading={status === 'sending'}>
              {t('auth.forgotPassword.buttonLabel')}
            </Button>
          </form>
        )}
      </AuthCard>
    </AuthPageShell>
  );
}