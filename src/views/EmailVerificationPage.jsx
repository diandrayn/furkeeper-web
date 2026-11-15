import { useEffect, useState } from 'react';
import { Link, useSearchParams } from '@/lib/router';
import AuthCard from '../components/AuthCard';
import AuthHeader from '../components/AuthHeader';
import AuthPageShell from '../components/AuthPageShell';
import Button from '../components/Button';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../i18n/LanguageContext';

export default function EmailVerificationPage() {
  const { verifyEmail } = useAuth();
  const { t } = useLanguage();
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const [status, setStatus] = useState('checking');
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    if (!token) return undefined;
    verifyEmail(token)
      .then(() => {
        if (active) setStatus('verified');
      })
      .catch((err) => {
        if (!active) return;
        setError(err?.message || t('auth.verifyEmail.invalid'));
        setStatus('invalid');
      });
    return () => {
      active = false;
    };
  }, [token, verifyEmail, t]);

  const verified = status === 'verified';
  const invalid = status === 'invalid' || !token;

  return (
    <AuthPageShell tone="burgundy">
      <AuthCard>
        <AuthHeader
          title={verified ? t('auth.verifyEmail.successTitle') : t('auth.verifyEmail.title')}
          subtitle={
            verified
              ? t('auth.verifyEmail.successSubtitle')
              : invalid
                ? error || t('auth.verifyEmail.invalid')
                : t('auth.verifyEmail.checking')
          }
        />
        {verified ? (
          <Link to="/login">
            <Button variant="orange" fullWidth>
              {t('auth.verifyEmail.login')}
            </Button>
          </Link>
        ) : invalid ? (
          <Link to="/login">
            <Button variant="outline" fullWidth>
              {t('auth.forgotPassword.backToLogin')}
            </Button>
          </Link>
        ) : (
          <p className="text-center text-sm text-text-secondary" role="status">
            {t('auth.verifyEmail.checking')}
          </p>
        )}
      </AuthCard>
    </AuthPageShell>
  );
}
