import { useState } from 'react';
import { Link, useSearchParams } from '@/lib/router';
import AuthCard from '../components/AuthCard';
import AuthHeader from '../components/AuthHeader';
import AuthPageShell from '../components/AuthPageShell';
import Input from '../components/Input';
import PasswordInput from '../components/PasswordInput';
import Checkbox from '../components/Checkbox';
import Button from '../components/Button';
import Stepper from '../components/Stepper';
import ImagePlaceholder from '../components/ImagePlaceholder';
import { getPasswordStrength, isValidEmail } from '../utils/validation';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../i18n/LanguageContext';

// Bug fix: this file used to be a stray copy of BuyerRegisterPage (even its
// function name was still `BuyerRegisterPage`) — so choosing "Penjual
// Produk" or "Penyedia Jasa" on /register silently dropped people into the
// buyer sign-up flow instead. This is the real seller/service-provider
// registration: it reads `?type=seller|service` from the URL, collects
// business info in an extra step, and lands the account with a *pending*
// application (matching ApplicationStatusPage / DashboardRoute's review
// flow) instead of going straight to buyer's home-page redirect.

export default function PartnerRegisterPage() {
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const typeParam = searchParams.get('type');
  const COPY = {
    seller: { role: 'seller', ...t('auth.partnerRegister.seller') },
    service: { role: 'service', ...t('auth.partnerRegister.service') },
  };
  const copy = COPY[typeParam] || COPY.seller;
  const partnerStepLabels = [
    t('auth.buyerRegister.stepAccount'),
    t('auth.partnerRegister.stepBusiness'),
    t('auth.buyerRegister.stepOtp'),
  ];

  const { registerInit, resendConfirmation } = useAuth();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    fullName: '',
    emailOrPhone: '',
    password: '',
    confirmPassword: '',
    agreed: false,
    businessName: '',
    businessAddress: '',
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [confirmationNotice, setConfirmationNotice] = useState('');
  const [confirmationNoticeIsError, setConfirmationNoticeIsError] = useState(false);

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
    } else if (!isValidEmail(form.emailOrPhone)) {
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

  const validateStep2 = () => {
    const next = {};
    if (!form.businessName.trim()) next.businessName = `${copy.businessNameLabel} ${t('auth.partnerRegister.fieldRequiredSuffix')}`;
    if (!form.businessAddress.trim())
      next.businessAddress = `${copy.businessAddressLabel} ${t('auth.partnerRegister.fieldRequiredSuffix')}`;
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleStep1Continue = () => {
    if (!validateStep1()) return;
    setStep(2);
  };

  const handleStep2Continue = async () => {
    if (!validateStep2()) return;
    setIsSubmitting(true);
    setErrors((prev) => ({ ...prev, form: '' }));
    try {
      const result = await registerInit({
        fullName: form.fullName.trim(),
        emailOrPhone: form.emailOrPhone.trim(),
        password: form.password,
        role: copy.role,
        business: {
          businessName: form.businessName.trim(),
          businessAddress: form.businessAddress.trim(),
        },
      });
      setStep(3);
      setConfirmationNotice(result.emailSent ? '' : t('auth.buyerRegister.emailSendFailed'));
      setConfirmationNoticeIsError(!result.emailSent);
      if (result.emailSent) startResendTimer();
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
      const result = await resendConfirmation(form.emailOrPhone.trim());
      setConfirmationNotice(
        result.emailSent
          ? t('auth.login.confirmLinkSent')
          : t('auth.buyerRegister.emailSendFailed'),
      );
      setConfirmationNoticeIsError(!result.emailSent);
      if (result.emailSent) startResendTimer();
    } catch (err) {
      setConfirmationNotice(err.message || t('auth.login.resendFailed'));
      setConfirmationNoticeIsError(true);
    }
  };

  return (
    <AuthPageShell tone={copy.role === 'service' ? 'burgundy' : 'orange'}>
      <AuthCard className="max-w-lg">
        <Stepper steps={3} current={step} labels={partnerStepLabels} />

        {step === 1 && (
          <>
            <AuthHeader title={copy.heading} subtitle={copy.subtitle} />
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
                type="email"
                autoComplete="email"
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
              <Button
                variant="orange"
                fullWidth
                onClick={handleStep1Continue}
              >
                {t('auth.buyerRegister.continue')}
              </Button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <AuthHeader
              title={t('auth.partnerRegister.infoUsahaTitle')}
              subtitle={t('auth.partnerRegister.infoUsahaSubtitle')}
            />
            <div className="mt-6 space-y-4">
              <Input
                label={copy.businessNameLabel}
                value={form.businessName}
                onChange={update('businessName')}
                onBlur={validateStep2}
                error={errors.businessName}
                required
              />
              <Input
                label={copy.businessAddressLabel}
                value={form.businessAddress}
                onChange={update('businessAddress')}
                onBlur={validateStep2}
                error={errors.businessAddress}
                required
              />
              {errors.form && (
                <div className="rounded-xl bg-status-danger/10 px-4 py-3 text-sm text-status-danger" role="alert">
                  {errors.form}
                </div>
              )}
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>
                  {t('auth.partnerRegister.back')}
                </Button>
                <Button
                  variant="orange"
                  className="flex-1"
                  loading={isSubmitting}
                  onClick={handleStep2Continue}
                >
                  {t('auth.buyerRegister.continue')}
                </Button>
              </div>
            </div>
          </>
        )}

        {step === 3 && (
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
              {confirmationNotice && (
                <p className={`text-center text-xs ${confirmationNoticeIsError ? 'text-status-danger' : 'text-status-success'}`}>
                  {confirmationNotice}
                </p>
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

      </AuthCard>
    </AuthPageShell>
  );
}
