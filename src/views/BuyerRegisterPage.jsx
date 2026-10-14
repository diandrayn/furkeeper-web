import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthCard from '../components/AuthCard';
import AuthHeader from '../components/AuthHeader';
import AuthPageShell from '../components/AuthPageShell';
import Input from '../components/Input';
import PasswordInput from '../components/PasswordInput';
import Checkbox from '../components/Checkbox';
import Button from '../components/Button';
import Stepper from '../components/Stepper';
import ImagePlaceholder from '../components/ImagePlaceholder';
import {
  isValidEmailOrPhone,
  getPasswordStrength,
} from '../utils/validation';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../i18n/LanguageContext';

export default function BuyerRegisterPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { registerInit, resendConfirmation, isLoggedIn } = useAuth();
  const buyerStepLabels = [t('auth.buyerRegister.stepAccount'), t('auth.buyerRegister.stepOtp')];
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    fullName: '',
    emailOrPhone: '',
    password: '',
    confirmPassword: '',
    agreed: false,
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verified, setVerified] = useState(false);
  const [resendTimer, setResendTimer] = useState(45);

  const update = (field) => (e) => {
    const value = e.target.value;
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === 'confirmPassword' || field === 'password') {
        setErrors((errs) => ({
          ...errs,
          confirmPassword:
            next.confirmPassword && next.password !== next.confirmPassword
              ? t('auth.buyerRegister.errorPasswordMismatch')
              : '',
        }));
      }
      return next;
    });
  };

  const validateStep1 = () => {
    const next = {};
    if (!form.fullName.trim()) next.fullName = t('auth.buyerRegister.errorFullNameRequired');
    if (!form.emailOrPhone.trim()) {
      next.emailOrPhone = t('auth.login.errorEmailOrPhoneRequired');
    } else if (!isValidEmailOrPhone(form.emailOrPhone)) {
      next.emailOrPhone = t('auth.login.errorEmailOrPhoneInvalid');
    }
    if (!form.password) {
      next.password = t('auth.login.errorPasswordRequired');
    } else if (getPasswordStrength(form.password) < 2) {
      next.password = t('auth.buyerRegister.errorPasswordWeak');
    }
    if (form.password !== form.confirmPassword) {
      next.confirmPassword = t('auth.buyerRegister.errorPasswordMismatch');
    }
    if (!form.agreed) next.agreed = t('auth.buyerRegister.errorMustAgree');
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleContinue = async () => {
    if (!validateStep1()) return;
    setIsSubmitting(true);
    setErrors((prev) => ({ ...prev, form: '' }));
    try {
      await registerInit({
        fullName: form.fullName.trim(),
        emailOrPhone: form.emailOrPhone.trim(),
        password: form.password,
        role: 'buyer',
      });
      setStep(2);
      startResendTimer();
    } catch (err) {
      if (err.fields) setErrors((prev) => ({ ...prev, ...err.fields }));
      else setErrors((prev) => ({ ...prev, form: err.message }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const startResendTimer = () => {
    setResendTimer(45);
    const interval = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleResend = async () => {
    try {
      await resendConfirmation(form.emailOrPhone.trim());
      startResendTimer();
    } catch (err) {
      setErrors({ confirm: err.message });
    }
  };

  // The confirmation LINK is what actually signs the user in — Supabase
  // parses it and fires onAuthStateChange, which updates `isLoggedIn`
  // globally. If that happens in this same browser (same tab after a
  // full-page redirect, or a different tab synced via localStorage), just
  // react to it here instead of waiting for any explicit submit.
  useEffect(() => {
    if (step === 2 && isLoggedIn && !verified) {
      setVerified(true);
      setTimeout(() => navigate('/'), 1500);
    }
  }, [step, isLoggedIn, verified, navigate]);

  return (
    <AuthPageShell tone="orange">
      <AuthCard className="max-w-lg">
        <Stepper steps={2} current={step} labels={buyerStepLabels} />

        {step === 1 && (
          <>
            <AuthHeader
              title={t('auth.buyerRegister.title')}
              subtitle={t('auth.buyerRegister.subtitle')}
            />
            <div className="mt-6 space-y-4">
              <Input
                label={t('auth.buyerRegister.fullNameLabel')}
                value={form.fullName}
                onChange={update('fullName')}
                onBlur={validateStep1}
                error={errors.fullName}
                required
              />
              <Input
                label={t('auth.login.emailOrPhoneLabel')}
                value={form.emailOrPhone}
                onChange={update('emailOrPhone')}
                onBlur={validateStep1}
                error={errors.emailOrPhone}
                required
              />
              <PasswordInput
                label={t('auth.login.passwordLabel')}
                value={form.password}
                onChange={update('password')}
                onBlur={validateStep1}
                error={errors.password}
                showStrengthMeter
                required
              />
              <PasswordInput
                label={t('auth.buyerRegister.confirmPasswordLabel')}
                value={form.confirmPassword}
                onChange={update('confirmPassword')}
                onBlur={validateStep1}
                error={errors.confirmPassword}
                required
              />
              <Checkbox
                checked={form.agreed}
                onChange={(e) => setForm((p) => ({ ...p, agreed: e.target.checked }))}
                label={
                  <>
                    {t('auth.buyerRegister.agreeText')}{' '}
                    <Link to="/terms" className="font-medium text-brand-burgundy hover:underline">
                      {t('auth.buyerRegister.termsLink')}
                    </Link>
                  </>
                }
                required
              />
              {errors.agreed && (
                <p className="text-xs text-status-danger">{errors.agreed}</p>
              )}
              {errors.form && (
                <div className="rounded-xl bg-status-danger/10 px-4 py-3 text-sm text-status-danger" role="alert">
                  {errors.form}
                </div>
              )}
              <Button
                variant="orange"
                fullWidth
                loading={isSubmitting}
                disabled={!form.agreed}
                onClick={handleContinue}
              >
                {t('auth.buyerRegister.continue')}
              </Button>
            </div>
          </>
        )}

        {step === 2 && !verified && (
          <>
            <div className="flex justify-center">
              <ImagePlaceholder
                className="h-20 w-20 rounded-2xl"
                alt="Ilustrasi verifikasi — ganti dengan foto asli"
              />
            </div>
            <AuthHeader
              title={t('auth.buyerRegister.verifyTitle')}
              subtitle={t('auth.buyerRegister.verifySubtitle').replace('{value}', form.emailOrPhone)}
            />
            <div className="mt-6 space-y-6">
              {errors.confirm && (
                <p className="text-center text-xs text-status-danger">{errors.confirm}</p>
              )}
              <p className="text-center text-sm text-text-secondary">
                {resendTimer > 0 ? (
                  <>{t('auth.buyerRegister.resendIn').replace('{value}', String(resendTimer).padStart(2, '0'))}</>
                ) : (
                  <button
                    type="button"
                    onClick={handleResend}
                    className="font-medium text-brand-burgundy hover:underline"
                  >
                    {t('auth.buyerRegister.resendCode')}
                  </button>
                )}
              </p>
              <p className="text-center text-xs text-text-secondary">
                {t('auth.buyerRegister.openOnAnotherDevice')}{' '}
                <Link to="/login" className="font-medium text-brand-burgundy hover:underline">
                  {t('auth.buyerRegister.goToLogin')}
                </Link>
              </p>
            </div>
          </>
        )}

        {verified && (
          <div className="flex flex-col items-center py-8 text-center">
            <ImagePlaceholder
              className="h-24 w-24 rounded-2xl"
              alt="Ilustrasi berhasil — ganti dengan foto asli"
            />
            <p className="mt-4 font-heading text-lg font-bold text-text-primary">
              {t('auth.buyerRegister.verifiedTitle')}
            </p>
            <p className="mt-1 text-sm text-text-secondary">{t('auth.buyerRegister.verifiedSubtitle')}</p>
          </div>
        )}
      </AuthCard>
    </AuthPageShell>
  );
}
