import { useEffect, useState } from 'react';
import { fetchMyAdminScope } from '../utils/adminScope';

/** { scope, isLoading } for the signed-in admin. `scope` is null while loading. */
export function useAdminScope() {
  const [scope, setScope] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetchMyAdminScope().then((value) => {
      if (!cancelled) setScope(value);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return { scope, isLoading: scope === null };
}
