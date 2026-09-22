import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Send, Mail, Phone, MapPin, LogIn } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import WaveDivider from '../components/decorative/WaveDivider';
import Input from '../components/Input';
import Textarea from '../components/Textarea';
import Select from '../components/Select';
import Checkbox from '../components/Checkbox';
import Button from '../components/Button';
import PawPrintPattern from '../components/decorative/PawPrintPattern';
import { useLanguage } from '../i18n/LanguageContext';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabaseClient';

export default function ContactPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { user, isLoggedIn } = useAuth();
  const subjectOptions = [
    { value: 'adopsi', label: t('contact.subjectAdopsi') },
    { value: 'produk', label: t('contact.subjectProduk') },
    { value: 'jasa', label: t('contact.subjectJasa') },
    { value: 'mitra', label: t('contact.subjectMitra') },
    { value: 'lainnya', label: t('contact.subjectLainnya') },
  ];
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    message: '',
    subject: '',
    agreed: false,
  });
  const [errors, setErrors] = useState({});
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // Nama & email terisi otomatis dari akun begitu user login — form ini
  // hanya bisa dikirim oleh user yang login (lihat handleSubmit), jadi
  // datanya sudah pasti ada dan tidak perlu diketik ulang.
  useEffect(() => {
    if (!user) return;
    const [firstName, ...rest] = (user.name || '').trim().split(/\s+/);
    setForm((prev) => ({
      ...prev,
      firstName: prev.firstName || firstName || '',
      lastName: prev.lastName || rest.join(' '),
      email: prev.email || user.email || '',
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const update = (field) => (e) => {
    const value = field === 'agreed' ? e.target.checked : e.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isLoggedIn) return;
    const nextErrors = {};
    if (!form.firstName.trim()) nextErrors.firstName = t('contact.errorFirstNameRequired');
    if (!form.email.trim()) nextErrors.email = t('contact.errorEmailRequired');
    if (!form.message.trim()) nextErrors.message = t('contact.errorMessageRequired');
    if (!form.subject) nextErrors.subject = t('contact.errorSubjectRequired');
    if (!form.agreed) nextErrors.agreed = t('contact.errorMustAgree');

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    try {
      const subjectLabel = subjectOptions.find((o) => o.value === form.subject)?.label || form.subject;
      const { error } = await supabase.from('help_messages').insert({
        user_id: user.id,
        name: [form.firstName, form.lastName].filter(Boolean).join(' '),
        email: form.email,
        subject: subjectLabel,
        body: form.message,
      });
      if (error) throw error;
      setSent(true);
    } catch (err) {
      console.error('Gagal mengirim pesan bantuan:', err);
      setSubmitError(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Navbar activeLink="Bantuan" />
      <main>
        <section className="relative overflow-hidden bg-gradient-to-br from-brand-burgundy via-brand-burgundy to-[#3a4fb0] py-14 lg:py-20">
          <PawPrintPattern className="text-white" opacity={0.12} />
          <div className="relative mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
            <div className="rounded-[2rem] bg-brand-cream/95 p-6 shadow-2xl sm:p-10">
              {sent ? (
                <div className="flex flex-col items-center py-10 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-status-success/15">
                    <Send className="h-7 w-7 text-status-success" aria-hidden="true" />
                  </div>
                  <h1 className="mt-5 font-hero text-2xl text-brand-burgundy sm:text-3xl">
                    {t('contact.sentTitle')}
                  </h1>
                  <p className="mt-2 max-w-sm text-sm text-text-secondary">
                    {t('contact.sentSubtitle')}
                  </p>
                  <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                    <Button variant="primary" onClick={() => navigate('/bantuan')}>
                      {t('contact.backToHelp')}
                    </Button>
                    <Button variant="outline" onClick={() => navigate('/bantuan-saya?tab=pesan')}>
                      {t('contact.viewMyMessages')}
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="text-center">
                    <h1 className="font-hero text-3xl text-brand-burgundy sm:text-4xl">
                      {t('contact.heading')}
                    </h1>
                    <p className="mx-auto mt-2 max-w-md text-sm text-text-secondary">
                      {t('contact.subheading')}
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} className="mt-8 space-y-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <Input
                        label={t('contact.firstNameLabel')}
                        placeholder="John"
                        value={form.firstName}
                        onChange={update('firstName')}
                        error={errors.firstName}
                        required
                      />
                      <Input
                        label={t('contact.lastNameLabel')}
                        placeholder="Smith"
                        value={form.lastName}
                        onChange={update('lastName')}
                      />
                    </div>

                    <Input
                      label={t('contact.emailLabel')}
                      type="email"
                      placeholder="johnsmith@gmail.com"
                      value={form.email}
                      onChange={update('email')}
                      error={errors.email}
                      required
                    />

                    <Textarea
                      label={t('contact.messageLabel')}
                      placeholder={t('contact.messagePlaceholder')}
                      value={form.message}
                      onChange={update('message')}
                      error={errors.message}
                      required
                    />

                    <Select
                      label={t('contact.subjectLabel')}
                      placeholder={t('contact.subjectPlaceholder')}
                      options={subjectOptions}
                      value={form.subject}
                      onChange={update('subject')}
                      error={errors.subject}
                      required
                    />

                    <div>
                      <Checkbox
                        label={
                          <>
                            {t('contact.agreeText')}{' '}
                            <Link
                              to="/syarat-ketentuan"
                              className="font-semibold text-brand-burgundy underline"
                            >
                              {t('contact.termsLink')}
                            </Link>
                          </>
                        }
                        checked={form.agreed}
                        onChange={update('agreed')}
                      />
                      {errors.agreed && (
                        <p className="mt-1 text-xs text-status-danger">{errors.agreed}</p>
                      )}
                    </div>

                    <div className="pt-1 text-right">
                      {submitError && (
                        <p className="mb-2 text-left text-xs text-status-danger">
                          Gagal mengirim pesan. Coba lagi sebentar lagi.
                        </p>
                      )}
                      {isLoggedIn ? (
                        <Button type="submit" variant="orange" icon={<Send className="h-4 w-4" />} loading={submitting}>
                          {t('contact.send')}
                        </Button>
                      ) : (
                        <>
                          <p className="mb-2 text-left text-xs text-text-secondary">
                            {t('contact.loginRequiredNote')}
                          </p>
                          <Button
                            type="button"
                            variant="orange"
                            icon={<LogIn className="h-4 w-4" />}
                            onClick={() => navigate('/login', { state: { from: { pathname: '/kontak' } } })}
                          >
                            {t('contact.loginToSend')}
                          </Button>
                        </>
                      )}
                    </div>
                  </form>
                </>
              )}
            </div>

            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="playful-interactive flex items-center gap-3 rounded-2xl bg-white/10 p-4 text-white backdrop-blur-sm">
                <Phone className="h-5 w-5 shrink-0" aria-hidden="true" />
                <span className="text-sm">+62 812-3456-7890</span>
              </div>
              <div className="playful-interactive flex items-center gap-3 rounded-2xl bg-white/10 p-4 text-white backdrop-blur-sm">
                <Mail className="h-5 w-5 shrink-0" aria-hidden="true" />
                <span className="text-sm">hello@furkeeper.id</span>
              </div>
              <div className="playful-interactive flex items-center gap-3 rounded-2xl bg-white/10 p-4 text-white backdrop-blur-sm">
                <MapPin className="h-5 w-5 shrink-0" aria-hidden="true" />
                <span className="text-sm">Malang, Jawa Timur</span>
              </div>
            </div>
          </div>
        </section>
      </main>
      <WaveDivider topColor="text-brand-cream" bottomColor="bg-brand-burgundy" />
      <Footer />
    </>
  );
}
