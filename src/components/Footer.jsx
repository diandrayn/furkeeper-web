import { Phone, MapPin, Mail } from 'lucide-react';
import { Link } from '@/lib/router';
import Logo from './Logo';
import PawPrintPattern from './decorative/PawPrintPattern';
import { useLanguage } from '../i18n/LanguageContext';

const footerLinks = [
  { key: 'produk', href: '/produk' },
  { key: 'jasa', href: '/jasa' },
  { key: 'tentangKami', href: '/tentang-kami' },
  { key: 'bantuan', href: '/bantuan' },
];

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="relative overflow-hidden bg-brand-burgundy text-white">
      <PawPrintPattern className="text-white" opacity={0.06} density="sparse" />
      <div className="relative mx-auto max-w-container px-4 py-12 md:px-6 lg:px-8 lg:py-16">
        <div className="grid gap-10 md:grid-cols-3">
          <div className="space-y-4">
            <Logo variant="light" />
            <p className="max-w-xs text-sm leading-relaxed text-white/70">
              {t('footer.tagline')}
            </p>
          </div>

          <div>
            <h3 className="mb-4 font-heading text-lg font-semibold">{t('footer.navigasi')}</h3>
            <ul className="space-y-2.5">
              {footerLinks.map((link) => (
                <li key={link.key}>
                  <Link
                    to={link.href}
                    className="text-sm text-white/70 transition-colors duration-200 hover:text-white"
                  >
                    {t(`nav.${link.key}`)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-4 font-heading text-lg font-semibold">{t('footer.kontak')}</h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-2.5 text-sm text-white/70">
                <Phone className="h-4 w-4 shrink-0" aria-hidden="true" />
                +62 812-3456-7890
              </li>
              <li className="flex items-start gap-2.5 text-sm text-white/70">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                Jl. Veteran No. 10, Malang, Jawa Timur
              </li>
              <li className="flex items-center gap-2.5 text-sm text-white/70">
                <Mail className="h-4 w-4 shrink-0" aria-hidden="true" />
                hello@furkeeper.id
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center gap-2 border-t border-white/10 pt-6 text-center text-xs text-white/50 sm:flex-row sm:justify-between">
          <p suppressHydrationWarning>© {new Date().getFullYear()} FurKeeper. {t('footer.hakCipta')}</p>
          <div className="flex items-center gap-4">
            <Link
              to="/syarat-ketentuan"
              className="transition-colors duration-200 hover:text-white"
            >
              {t('footer.syarat')}
            </Link>
            <Link
              to="/kebijakan-privasi"
              className="transition-colors duration-200 hover:text-white"
            >
              {t('footer.privasi')}
            </Link>
            <Link
              to="/kebijakan-pembatalan"
              className="transition-colors duration-200 hover:text-white"
            >
              {t('footer.pembatalan')}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
