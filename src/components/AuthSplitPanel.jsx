import PawPrintPattern from './decorative/PawPrintPattern';
import ImagePlaceholder from './ImagePlaceholder';

/**
 * AuthSplitPanel
 * The non-form half of a Login/Register split screen: gradient background,
 * scattered paw prints, one centered real photo. Hidden below `lg` — on
 * mobile the form takes the full screen.
 *
 * This is intentionally the ONLY place decoration lives on auth screens;
 * the form card next to it must stay plain (see AuthCard usage in
 * LoginPage/BuyerRegisterPage/PartnerRegisterPage).
 *
 * `tone`: 'burgundy' | 'orange' — which gradient to use.
 * `photoAlt`: alt text for the photo slot — swap the ImagePlaceholder's
 *             source for your own real pet/team photo.
 * `title` / `subtitle`: short, optional supporting copy (Bahasa Indonesia).
 */
export default function AuthSplitPanel({
  tone = 'burgundy',
  photoAlt = 'Foto hewan peliharaan — ganti dengan foto asli',
  title,
  subtitle,
  className = '',
}) {
  const gradient =
    tone === 'orange'
      ? 'bg-gradient-to-br from-brand-orange-start to-brand-orange-end'
      : 'bg-gradient-to-br from-brand-burgundy to-[#8a3f3f]';

  return (
    <div className={`relative hidden overflow-hidden lg:flex lg:w-1/2 lg:items-center lg:justify-center ${gradient} ${className}`}>
      <PawPrintPattern className="text-white" opacity={0.14} />

      <div className="relative z-10 flex flex-col items-center px-10 text-center">
        <ImagePlaceholder
          className="h-48 w-48 rounded-[2.5rem] shadow-lg"
          alt={photoAlt}
        />
        {title && (
          <h2 className="mt-6 font-hero text-2xl font-semibold text-white sm:text-3xl">
            {title}
          </h2>
        )}
        {subtitle && (
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-white/80">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
