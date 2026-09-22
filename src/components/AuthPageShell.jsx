import Logo from './Logo';
import AuthSilhouetteField from './decorative/AuthSilhouettes';

/**
 * AuthPageShell
 * Shared centered layout for every auth screen (Login, RegisterPage,
 * BuyerRegisterPage, PartnerRegisterPage). Replaces the old 50/50
 * split-panel layout (see AuthSplitPanel — no longer used) with a single
 * centered column: logo, form card, and a scatter of decorative
 * paw/cat/dog silhouettes placed abstractly around it.
 */
export default function AuthPageShell({ children, tone = 'burgundy', maxWidth = 'max-w-md' }) {
  return (
    <div className="relative flex min-h-screen flex-col items-center overflow-hidden bg-brand-cream px-4 py-10">
      <AuthSilhouetteField tone={tone} />

      <div className="relative z-10 flex w-full flex-col items-center">
        <Logo className="mb-6" />
        <div className={`w-full ${maxWidth}`}>{children}</div>
      </div>
    </div>
  );
}
