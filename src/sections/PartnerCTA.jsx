import { useNavigate } from '@/lib/router';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../i18n/LanguageContext';
import sellerImg from '../assets/become-seller.jpg';
import serviceImg from '../assets/become-service.jpg';

const partnerCardKeys = ['seller', 'service'];
const partnerImages = { seller: sellerImg, service: serviceImg };

// Kartu "Jadi Penjual"/"Jadi Penyedia Jasa" tidak boleh melempar akun mitra
// yang SUDAH terdaftar ke formulir pendaftaran akun baru (/register/partner)
// — emailnya sudah terpakai, jadi itu jalan buntu ("selalu disuruh daftar").
// Rute disesuaikan status akun saat ini:
//   - tamu / akun pembeli      → /register/partner?type=seller|service
//   - mitra aktif              → dashboard toko/jasa
//   - mitra sedang ditinjau    → /status-pengajuan
//   - mitra ditolak            → /pengajuan-ulang
//   - mitra status belum tercatat → dashboard (guard menampilkan panduan pemulihan)
export default function PartnerCTA() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { user, isLoggedIn } = useAuth();

  const partnerRoute = (key) => {
    const type = key === 'service' ? 'service' : 'seller';
    if (!isLoggedIn) {
      navigate(`/register/partner?type=${type}`);
      return;
    }

    const isSameRole = user?.role === type;
    if (!isSameRole) {
      navigate(`/register/partner?type=${type}`);
      return;
    }

    const status = type === 'service' ? user?.providerStatus : user?.sellerStatus;
    if (status === 'active') {
      navigate(type === 'service' ? '/dashboard/jasa' : '/dashboard/toko');
    } else if (status === 'pending') {
      navigate('/status-pengajuan');
    } else if (status === 'rejected') {
      navigate('/pengajuan-ulang');
    } else {
      // status 'none' — akun mitra lama; guard dashboard menampilkan
      // panduan pemulihan (hubungi admin), bukan formulir daftar baru.
      navigate(type === 'service' ? '/dashboard/jasa' : '/dashboard/toko');
    }
  };

  return (
    <section className="mx-auto max-w-container px-4 py-16 md:px-6 md:py-20 lg:px-8 lg:py-24">
      <div className="rounded-3xl bg-brand-peach/80 px-6 py-10 md:px-14">
        <div className="mb-8">
          <h2 className="font-heading text-2xl text-brand-burgundy md:text-3xl">
            {t('partnerCTA.title')}
          </h2>
          <p className="mt-2 text-sm text-text-secondary md:text-base">
            {t('partnerCTA.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {partnerCardKeys.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => partnerRoute(key)}
              className="group overflow-hidden rounded-2xl bg-white text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
            >
              <img
                src={partnerImages[key]}
                alt={`Ilustrasi ${t(`partnerCTA.${key}.title`)}`}
                className="aspect-video w-full object-cover"
              />
              <div className="p-6">
                <h3 className="font-heading text-lg font-bold text-brand-burgundy">
                  {t(`partnerCTA.${key}.title`)}
                </h3>
                <p className="mt-2 text-sm text-text-secondary">{t(`partnerCTA.${key}.description`)}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}