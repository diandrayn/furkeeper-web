import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Camera, Store, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';
import Card from '../components/Card';
import Input from '../components/Input';
import Button from '../components/Button';
import Badge from '../components/Badge';
import PasswordInput from '../components/PasswordInput';
import ConfirmDialog from '../components/dashboard/ConfirmDialog';
import { useAuth } from '../hooks/useAuth';
import { getInitials } from '../utils/status';
import { useLanguage } from '../i18n/LanguageContext';

export default function ProfilePage() {
  const { t } = useLanguage();
  const { user, logout, updateUser, changePassword, deleteAccount } = useAuth();
  const navigate = useNavigate();
  const defaultBadges = [
    { id: 'active-buyer', label: t('profile.defaultBadgeActiveTitle'), description: t('profile.defaultBadgeActiveDesc') },
    { id: 'loyal', label: t('profile.defaultBadgeLoyalTitle'), description: t('profile.defaultBadgeLoyalDesc') },
  ];
  const fileRef = useRef(null);
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [saved, setSaved] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [passwords, setPasswords] = useState({ oldPassword: '', nextPassword: '', confirm: '' });
  const [passwordMsg, setPasswordMsg] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const badges = user?.badges?.length ? user.badges : defaultBadges;
  const emailVerified = user?.emailVerified !== false && Boolean(user?.email?.includes('@'));

  const handlePhoto = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => updateUser({ avatarUrl: reader.result });
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    updateUser({ name: name.trim() || user.name, phone });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handlePassword = async () => {
    if (!passwords.oldPassword || !passwords.nextPassword) return;
    if (passwords.nextPassword !== passwords.confirm) {
      setPasswordMsg(t('profile.errorPasswordMismatch'));
      return;
    }
    setPasswordMsg('');
    setPasswordSaving(true);
    try {
      await changePassword({ oldPassword: passwords.oldPassword, newPassword: passwords.nextPassword });
      setPasswordOpen(false);
      setPasswords({ oldPassword: '', nextPassword: '', confirm: '' });
    } catch (err) {
      setPasswordMsg(err.message || t('profile.errorPasswordMismatch'));
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    setDeleteError('');
    try {
      await deleteAccount();
      navigate('/');
    } catch (err) {
      setDeleteError(err.message || t('profile.deleteAccountError'));
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-col items-center">
          <div className="relative">
            <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full bg-brand-burgundy text-2xl font-bold text-white">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                getInitials(user?.name)
              )}
            </div>
            <button
              type="button"
              className="absolute bottom-0 right-0 flex h-9 w-9 items-center justify-center rounded-full bg-brand-orange-end text-white shadow"
              aria-label={t('profile.uploadPhotoAria')}
              onClick={() => fileRef.current?.click()}
            >
              <Camera className="h-4 w-4" />
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
          </div>
        </div>

        <div className="mt-8 space-y-4">
          <Input label={t('profile.nameLabel')} value={name} onChange={(e) => setName(e.target.value)} />
          <div>
            <div className="mb-1.5 flex items-center gap-2">
              <span className="text-sm font-medium text-text-primary">{t('profile.emailLabel')}</span>
              {emailVerified ? (
                <Badge variant="active" label={t('profile.verified')} />
              ) : (
                <Badge variant="optional" label={t('profile.notVerified')} />
              )}
            </div>
            <Input id="profile-email" value={user?.email || ''} disabled />
          </div>
          <Input label={t('profile.phoneLabel')} value={phone} onChange={(e) => setPhone(e.target.value)} />
          <Button variant="primary" onClick={handleSave}>
            {t('profile.saveChanges')}
          </Button>
          {saved && <p className="text-sm text-status-success">{t('profile.savedMessage')}</p>}
        </div>
      </Card>

      {(user?.sellerStatus === 'active' || user?.providerStatus === 'active') && (
        <Card>
          <h2 className="mb-1 font-heading text-lg font-bold">{t('profile.myBusinessTitle')}</h2>
          <p className="mb-4 text-sm text-text-secondary">
            {t('profile.myBusinessSubtitle')}
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {user?.sellerStatus === 'active' && (
              <Link
                to="/dashboard/toko"
                className="group flex items-center justify-between rounded-2xl border border-gray-100 bg-brand-cream/50 p-4 transition-colors duration-150 hover:border-brand-orange-end/50"
              >
                <span className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-burgundy text-white">
                    <Store className="h-5 w-5" />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-text-primary">{t('profile.storeDashboard')}</span>
                    <span className="block text-xs text-text-secondary">{t('profile.storeDashboardDesc')}</span>
                  </span>
                </span>
                <ArrowRight className="h-4 w-4 text-text-secondary transition-transform duration-150 group-hover:translate-x-0.5" />
              </Link>
            )}
            {user?.providerStatus === 'active' && (
              <Link
                to="/dashboard/jasa"
                className="group flex items-center justify-between rounded-2xl border border-gray-100 bg-brand-cream/50 p-4 transition-colors duration-150 hover:border-brand-orange-end/50"
              >
                <span className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-burgundy text-white">
                    <Sparkles className="h-5 w-5" />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-text-primary">{t('profile.serviceDashboard')}</span>
                    <span className="block text-xs text-text-secondary">{t('profile.serviceDashboardDesc')}</span>
                  </span>
                </span>
                <ArrowRight className="h-4 w-4 text-text-secondary transition-transform duration-150 group-hover:translate-x-0.5" />
              </Link>
            )}
          </div>
        </Card>
      )}

      {(user?.sellerStatus === 'pending' || user?.providerStatus === 'pending') && (
        <Card className="!flex items-center gap-3 !bg-brand-peach/40">
          <ShieldCheck className="h-5 w-5 shrink-0 text-brand-burgundy" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-text-primary">{t('profile.pendingTitle')}</p>
            <p className="text-xs text-text-secondary">{t('profile.pendingSubtitle')}</p>
          </div>
          <Link to="/status-pengajuan" className="text-sm font-semibold text-brand-burgundy hover:underline">
            {t('profile.viewStatus')}
          </Link>
        </Card>
      )}

      <Card>
        <h2 className="mb-3 font-heading text-lg font-bold">{t('profile.myBadges')}</h2>
        <div className="flex flex-wrap gap-2">
          {badges.map((badge) => (
            <span key={badge.id || badge.label} className="group relative inline-flex" tabIndex={0}>
              <span className="inline-flex cursor-default rounded-full bg-brand-peach px-3 py-1 text-xs font-semibold text-brand-burgundy">
                {badge.label}
              </span>
              <span className="pointer-events-none absolute left-1/2 top-full z-10 mt-2 hidden w-52 -translate-x-1/2 rounded-lg bg-text-primary px-3 py-2 text-xs text-white shadow-lg group-hover:block group-focus-within:block">
                {badge.description}
              </span>
            </span>
          ))}
        </div>
      </Card>

      <Card>
        <h2 className="mb-3 font-heading text-lg font-bold">{t('profile.account')}</h2>
        <Button variant="outline" onClick={() => setPasswordOpen(true)}>
          {t('profile.changePassword')}
        </Button>
        <div className="mt-8 border-t border-gray-100 pt-6">
          <Button
            variant="outline"
            className="text-status-danger border-status-danger"
            onClick={() => {
              logout();
              navigate('/');
            }}
          >
            {t('profile.logout')}
          </Button>
        </div>
        <div className="mt-4 border-t border-gray-100 pt-4">
          <Button
            variant="outline"
            className="text-status-danger border-status-danger"
            onClick={() => {
              setDeleteError('');
              setDeleteOpen(true);
            }}
          >
            {t('profile.deleteAccount')}
          </Button>
          <p className="mt-2 text-xs text-text-secondary">{t('profile.deleteAccountWarning')}</p>
        </div>
      </Card>

      {passwordOpen && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label={t('profile.closeAria')}
            onClick={() => setPasswordOpen(false)}
          />
          <div className="relative z-10 w-full max-w-md rounded-t-3xl bg-white p-5 shadow-lg sm:rounded-2xl">
            <h2 className="mb-4 font-heading text-lg font-bold">{t('profile.changePassword')}</h2>
            <div className="space-y-3">
              <PasswordInput
                label={t('profile.oldPasswordLabel')}
                value={passwords.oldPassword}
                onChange={(e) => setPasswords({ ...passwords, oldPassword: e.target.value })}
              />
              <PasswordInput
                label={t('profile.newPasswordLabel')}
                showStrengthMeter
                value={passwords.nextPassword}
                onChange={(e) => setPasswords({ ...passwords, nextPassword: e.target.value })}
              />
              <PasswordInput
                label={t('profile.confirmNewPasswordLabel')}
                value={passwords.confirm}
                onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
              />
            </div>
            {passwordMsg && <p className="mt-2 text-xs text-status-danger">{passwordMsg}</p>}
            <div className="mt-5 flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setPasswordOpen(false)}>
                {t('profile.cancel')}
              </Button>
              <Button variant="primary" className="flex-1" onClick={handlePassword} disabled={passwordSaving}>
                {passwordSaving ? t('profile.changingPassword') : t('profile.save')}
              </Button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={deleteOpen}
        title={t('profile.deleteAccountConfirmTitle')}
        description={deleteError || t('profile.deleteAccountWarning')}
        confirmLabel={deleting ? t('profile.deletingAccount') : t('profile.deleteAccountConfirmButton')}
        cancelLabel={t('profile.cancel')}
        danger
        onConfirm={handleDeleteAccount}
        onCancel={() => (deleting ? null : setDeleteOpen(false))}
      />
    </div>
  );
}
