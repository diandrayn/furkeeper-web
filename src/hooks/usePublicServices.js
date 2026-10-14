import { useEffect, useState } from 'react';
import { fetchPublicServices } from '../utils/services';

/** Mirrors usePublicProducts.js — loads real provider services from
 * Supabase only, no demo/mock fallback. Logs (instead of swallowing)
 * fetch errors for the same reason. */
export function usePublicServices() {
  const [services, setServices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    fetchPublicServices()
      .then((rows) => {
        if (active) setServices(rows);
      })
      .catch((err) => {
        if (!active) return;
        console.error('fetchPublicServices failed:', err);
        setError(err);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return { services, isLoading, error };
}

export function findServiceById(list, id) {
  return list.find((item) => String(item.id) === String(id)) ?? null;
}