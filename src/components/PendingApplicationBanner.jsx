import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock, X } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const DISMISS_KEY = 'furkeeper_pending_banner_dismissed';

export default function PendingApplicationBanner() {
  const { user, isLoggedIn } = useAuth();
  const [dismissed, setDismissed] = useState(() => {
    try {
      return sessionStorage.getItem(DISMISS_KEY) === '1';
    } catch {
      return false;
    }
  });

  if (!isLoggedIn || dismissed) return null;

  const pendingSeller = user.sellerStatus === 'pending';
  const pendingProvider = user.providerStatus === 'pending';
  if (!pendingSeller && !pendingProvider) return null;

  const kind = pendingSeller && pendingProvider ? 'Toko/Jasa' : pendingSeller ? 'Toko' : 'Jasa';

  const handleDismiss = () => {
    setDismissed(true);
    try {
      sessionStorage.setItem(DISMISS_KEY, '1');
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="border-b border-status-warning/40 bg-[#FFF6E5]">
      <div className="mx-auto flex max-w-container items-center gap-3 px-4 py-2.5 md:px-6 lg:px-8">
        <Clock className="h-4 w-4 shrink-0 text-brand-orange-end" aria-hidden="true" />
        <p className="flex-1 text-sm text-text-primary">
          Pengajuan {kind} Anda sedang ditinjau admin — estimasi 1-2 hari kerja.{' '}
          <Link
            to="/status-pengajuan"
            className="font-semibold text-brand-burgundy hover:underline"
          >
            Lihat Status
          </Link>
        </p>
        <button
          type="button"
          onClick={handleDismiss}
          className="rounded-full p-1 text-text-secondary transition-colors hover:bg-status-warning/20 hover:text-text-primary"
          aria-label="Tutup banner"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
