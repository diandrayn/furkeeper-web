import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from '@/lib/router';
import { Camera, Image as ImageIcon, ExternalLink } from 'lucide-react';
import Card from '../../components/Card';
import Input from '../../components/Input';
import Textarea from '../../components/Textarea';
import Button from '../../components/Button';
import Checkbox from '../../components/Checkbox';
import Select from '../../components/Select';
import PasswordInput from '../../components/PasswordInput';
import ImagePlaceholder from '../../components/ImagePlaceholder';
import ConfirmDialog from '../../components/dashboard/ConfirmDialog';
import { useDashboard } from '../../hooks/useDashboard';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../i18n/LanguageContext';
import { districts } from '../../data/mockData';

export default function DashboardProfilePage({ mode }) {
  const isJasa = mode === 'jasa';
  const {
    storeProfile,
    providerProfile,
    updateStoreProfile,
    updateProviderProfile,
    storeId,
    serviceStoreId,
    isLoadingProfiles,
  } = useDashboard();
  const { logout, changePassword, deleteAccount } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const profile = isJasa ? providerProfile : storeProfile;
  const update = isJasa ? updateProviderProfile : updateStoreProfile;
  const myStoreId = isJasa ? serviceStoreId : storeId;
  const myStoreHref = profile?.slug
    ? `/toko/${profile.slug}`
    : myStoreId
      ? `/toko/${myStoreId}`
      : null;
  const districtOptions = districts.map((d) => ({ value: d, label: d }));

  const [form, setForm] = useState(profile);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  // Image upload state — files + object-URL previews (real uploaded URLs
  // replace the previews after the save writes to the `stores` table).
  const [logoFile, setLogoFile] = useState(null);
  const [bannerFile, setBannerFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [bannerPreview, setBannerPreview] = useState(null);
  const logoInputRef = useRef(null);
  const bannerInputRef = useRef(null);

  const [passwordOpen, setPasswordOpen] = useState(false);
  const [passwords, setPasswords] = useState({ oldPassword: '', nextPassword: '', confirm: '' });
  const [passwordMsg, setPasswordMsg] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // Resync the form whenever the context profile changes (initial DB load,
  // or after a save returns fresh logo/banner URLs). Clear image pickers
  // at the same time so stale previews don't survive a successful save.
  useEffect(() => {
    setForm(profile);
    setLogoFile(null);
    setBannerFile(null);
    setLogoPreview(null);
    setBannerPreview(null);
    setSaveError('');
  }, [profile]);

  const set = (key) => (event) => setForm((prev) => ({ ...prev, [key]: event.target.value }));

  const setHours = (index, field) => (event) => {
    const value = field === 'closed' ? event.target.checked : event.target.value;
    setForm((prev) => {
      const nextHours = prev.operatingHours.map((row, i) =>
        i === index ? { ...row, [field]: value } : row,
      );
      return { ...prev, operatingHours: nextHours };
    });
  };

  const pickImage = (kind) => (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (kind === 'logo') {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    } else {
      setBannerFile(file);
      setBannerPreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError('');
    try {
      // Persists to the `stores` table (and uploads logo/banner when
      // chosen) so the public store page reflects the edit.
      await update(form, { logoFile, bannerFile });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setSaveError(err.message || 'Gagal menyimpan profil, coba lagi.');
    } finally {
      setSaving(false);
    }
  };

  const handlePassword = async () => {
    if (!passwords.oldPassword || !passwords.nextPassword) return;
    if (passwords.nextPassword !== passwords.confirm) {
      setPasswordMsg('Konfirmasi kata sandi tidak sama');
      return;
    }
    setPasswordMsg('');
    setPasswordSaving(true);
    try {
      await changePassword({ oldPassword: passwords.oldPassword, newPassword: passwords.nextPassword });
      setPasswordOpen(false);
      setPasswords({ oldPassword: '', nextPassword: '', confirm: '' });
    } catch (err) {
      setPasswordMsg(err.message || 'Gagal mengubah password.');
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
      setDeleteError(err.message || 'Gagal menghapus akun, coba lagi.');
      setDeleting(false);
    }
  };

  const logoSrc = logoPreview || form.logoUrl || null;
  const bannerSrc = bannerPreview || form.bannerUrl || null;

  return (
    <div className="space-y-6">
      {isLoadingProfiles && (
        <p className="text-sm text-text-secondary">Memuat profil dari database...</p>
      )}

      <Card>
        <h2 className="mb-4 font-heading text-lg font-bold text-text-primary">
          {isJasa ? 'Sampul & Logo Bisnis' : 'Sampul & Logo Toko'}
        </h2>
        <div className="mb-4">
          <button
            type="button"
            onClick={() => bannerInputRef.current?.click()}
            className="relative block w-full overflow-hidden rounded-xl"
            aria-label="Unggah banner"
          >
            {bannerSrc ? (
              <img src={bannerSrc} alt="Banner" className="h-28 w-full rounded-xl object-cover sm:h-36" />
            ) : (
              <ImagePlaceholder className="h-28 w-full rounded-xl sm:h-36" alt="Banner" />
            )}
            <span className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white transition-colors hover:bg-black/55">
              <Camera className="h-4 w-4" />
            </span>
          </button>
          <input
            ref={bannerInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={pickImage('banner')}
          />
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-brand-burgundy text-white">
              {logoSrc ? (
                <img src={logoSrc} alt="Logo" className="h-full w-full object-cover" />
              ) : (
                <ImageIcon className="h-7 w-7 opacity-70" />
              )}
            </div>
            <button
              type="button"
              onClick={() => logoInputRef.current?.click()}
              className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-brand-orange-end text-white shadow transition-colors hover:opacity-90"
              aria-label="Unggah logo"
            >
              <Camera className="h-3.5 w-3.5" />
            </button>
            <input
              ref={logoInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={pickImage('logo')}
            />
          </div>
          <p className="text-xs text-text-secondary">
            Unggah logo persegi minimal 400x400px dan banner rasio 3:1 untuk hasil terbaik.
          </p>
        </div>
      </Card>

      <Card>
        <h2 className="mb-4 font-heading text-lg font-bold text-text-primary">Informasi Dasar</h2>
        <div className="space-y-4">
          <Input label={isJasa ? 'Nama Usaha' : 'Nama Toko'} value={form.name} onChange={set('name')} />
          <Input label="Kategori" value={form.category} onChange={set('category')} />
          <Input label="Tagline Singkat" value={form.tagline} onChange={set('tagline')} />
          <Textarea label="Deskripsi" rows={4} value={form.description} onChange={set('description')} />
        </div>
      </Card>

      <Card>
        <h2 className="mb-4 font-heading text-lg font-bold text-text-primary">{t('dashboardProfile.contactLocation')}</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label={t('dashboardProfile.phone')} value={form.phone} onChange={set('phone')} />
          <Input label={t('dashboardProfile.email')} value={form.email} onChange={set('email')} className="sm:col-span-2" />
          <Input label={t('dashboardProfile.address')} value={form.address} onChange={set('address')} className="sm:col-span-2" />
          <div>
            <Select
              label={t('dashboardProfile.district')}
              placeholder={t('dashboardProfile.districtPlaceholder')}
              options={districtOptions}
              value={form.district}
              onChange={(e) => setForm((prev) => ({ ...prev, district: e.target.value }))}
            />
            {!form.district && (
              <p className="mt-1.5 text-xs text-status-danger">{t('dashboardProfile.districtMissing')}</p>
            )}
          </div>
          <Input label={t('dashboardProfile.city')} value={form.city} onChange={set('city')} />
          <Textarea
            label={t('dashboardProfile.storePolicy')}
            rows={3}
            value={form.storePolicy || ''}
            onChange={set('storePolicy')}
            placeholder={t('dashboardProfile.storePolicyPlaceholder')}
            className="sm:col-span-2"
          />
        </div>
        {isJasa && (
          <div className="mt-4">
            <Checkbox
              label="Sediakan layanan datang ke lokasi pelanggan (home service)"
              checked={Boolean(form.homeService)}
              onChange={(e) => setForm((prev) => ({ ...prev, homeService: e.target.checked }))}
            />
          </div>
        )}
      </Card>

      <Card>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-heading text-lg font-bold text-text-primary">Jam Operasional</h2>
          <Checkbox
            label="Sedang buka"
            checked={Boolean(form.isOpen)}
            onChange={(e) => setForm((prev) => ({ ...prev, isOpen: e.target.checked }))}
          />
        </div>
        <div className="space-y-3">
          {form.operatingHours.map((row, index) => (
            <div key={row.day} className="flex flex-col gap-2 rounded-xl border border-gray-100 p-3 sm:flex-row sm:items-center">
              <span className="w-full text-sm font-medium text-text-primary sm:w-36">{row.day}</span>
              <div className="flex flex-1 items-center gap-2">
                <input
                  type="time"
                  value={row.open}
                  disabled={row.closed}
                  onChange={setHours(index, 'open')}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-orange-end disabled:bg-gray-50 disabled:text-text-secondary"
                />
                <span className="text-text-secondary">—</span>
                <input
                  type="time"
                  value={row.close}
                  disabled={row.closed}
                  onChange={setHours(index, 'close')}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-orange-end disabled:bg-gray-50 disabled:text-text-secondary"
                />
              </div>
              <Checkbox label="Tutup" checked={Boolean(row.closed)} onChange={setHours(index, 'closed')} />
            </div>
          ))}
        </div>
      </Card>

      <div className="flex flex-wrap items-center gap-3">
        <Button variant="orange" onClick={handleSave} playful={false} loading={saving} disabled={saving}>
          {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
        </Button>
        {saved && <p className="text-sm text-status-success">Profil tersimpan.</p>}
        {!saved && saveError && <p className="text-sm text-status-danger">{saveError}</p>}
        {myStoreHref && (
          <Link
            to={myStoreHref}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-burgundy hover:underline"
          >
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
            {t('dashboardProfile.viewStore')}
          </Link>
        )}
      </div>

      <Card>
        <h2 className="mb-4 font-heading text-lg font-bold text-text-primary">Akun</h2>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" playful={false} onClick={() => setPasswordOpen(true)}>
            Ubah Password
          </Button>
          <Button
            variant="outline"
            playful={false}
            className="text-status-danger border-status-danger"
            onClick={() => {
              logout();
              navigate('/');
            }}
          >
            Keluar
          </Button>
        </div>
        <div className="mt-6 border-t border-gray-100 pt-5">
          <Button
            variant="outline"
            playful={false}
            className="text-status-danger border-status-danger"
            onClick={() => {
              setDeleteError('');
              setDeleteOpen(true);
            }}
          >
            Hapus Akun
          </Button>
          <p className="mt-2 text-xs text-text-secondary">
            Menghapus akun akan menghapus permanen profil, toko/jasa, produk atau layanan, pesanan, dan riwayat chat kamu. Tindakan ini tidak bisa dibatalkan.
          </p>
        </div>
      </Card>

      {passwordOpen && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Tutup"
            onClick={() => setPasswordOpen(false)}
          />
          <div className="relative z-10 w-full max-w-md rounded-t-3xl bg-white p-5 shadow-lg sm:rounded-2xl">
            <h2 className="mb-4 font-heading text-lg font-bold">Ubah Password</h2>
            <div className="space-y-3">
              <PasswordInput
                label="Password Lama"
                value={passwords.oldPassword}
                onChange={(e) => setPasswords({ ...passwords, oldPassword: e.target.value })}
              />
              <PasswordInput
                label="Password Baru"
                showStrengthMeter
                value={passwords.nextPassword}
                onChange={(e) => setPasswords({ ...passwords, nextPassword: e.target.value })}
              />
              <PasswordInput
                label="Konfirmasi Password Baru"
                value={passwords.confirm}
                onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
              />
            </div>
            {passwordMsg && <p className="mt-2 text-xs text-status-danger">{passwordMsg}</p>}
            <div className="mt-5 flex gap-2">
              <Button variant="outline" className="flex-1" playful={false} onClick={() => setPasswordOpen(false)}>
                Batal
              </Button>
              <Button variant="primary" className="flex-1" playful={false} onClick={handlePassword} disabled={passwordSaving}>
                {passwordSaving ? 'Menyimpan...' : 'Simpan'}
              </Button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={deleteOpen}
        title="Hapus akun secara permanen?"
        description={deleteError || 'Menghapus akun akan menghapus permanen profil, toko/jasa, produk atau layanan, pesanan, dan riwayat chat kamu. Tindakan ini tidak bisa dibatalkan.'}
        confirmLabel={deleting ? 'Menghapus akun...' : 'Ya, Hapus Akun Saya'}
        cancelLabel="Batal"
        danger
        onConfirm={handleDeleteAccount}
        onCancel={() => (deleting ? null : setDeleteOpen(false))}
      />
    </div>
  );
}