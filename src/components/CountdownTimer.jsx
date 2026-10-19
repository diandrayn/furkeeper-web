import { useEffect, useState } from 'react';

function formatRemaining(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const hours = String(Math.floor(total / 3600)).padStart(2, '0');
  const minutes = String(Math.floor((total % 3600) / 60)).padStart(2, '0');
  const seconds = String(total % 60).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

export default function CountdownTimer({ deadline, duration }) {
  const [remaining, setRemaining] = useState(0);
  const [endsAt, setEndsAt] = useState(0);

  useEffect(() => {
    const computedEndsAt = deadline || Date.now() + (duration || 24 * 60 * 60) * 1000;
    setEndsAt(computedEndsAt);
    setRemaining(computedEndsAt - Date.now());
    const timer = setInterval(() => setRemaining(computedEndsAt - Date.now()), 1000);
    return () => clearInterval(timer);
  }, [deadline, duration]);

  return (
    <p className="text-sm font-medium text-brand-burgundy">
      Bayar dalam {formatRemaining(remaining)}
    </p>
  );
}
