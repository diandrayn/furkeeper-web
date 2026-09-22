import { PawPrint } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Logo({ variant = 'dark', className = '' }) {
  const isLight = variant === 'light';

  return (
    <Link to="/" className={`flex items-center gap-2.5 ${className}`}>
      <div
        className={`flex h-9 w-9 items-center justify-center rounded-full ${
          isLight ? 'bg-white' : 'bg-brand-burgundy'
        }`}
      >
        <PawPrint
          className={`h-5 w-5 ${isLight ? 'text-brand-burgundy' : 'text-white'}`}
          aria-hidden="true"
        />
      </div>
      <span
        className={`font-heading text-xl font-bold ${
          isLight ? 'text-white' : 'text-brand-burgundy'
        }`}
      >
        Furkeeper
      </span>
    </Link>
  );
}
