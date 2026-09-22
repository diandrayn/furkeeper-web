import { useEffect, useMemo, useState } from 'react';
import { services as demoServices } from '../data/mockServices';
import { fetchPublicServices } from '../utils/services';

/** Mirrors usePublicProducts.js — combines real provider services from
 * Supabase with the demo catalog, real ones listed first. Logs (instead of
 * swallowing) fetch errors for the same reason. */
export function usePublicServices() {
  const [realServices, setRealServices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    fetchPublicServices()
      .then((rows) => {
        if (active) setRealServices(rows);
      })
      .catch((err) => {
        if (!active) return;
        console.error('fetchPublicServices failed — falling back to demo catalog only:', err);
        setError(err);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const services = useMemo(() => [...realServices, ...demoServices], [realServices]);

  return { services, isLoading, error };
}

export function findServiceById(list, id) {
  return list.find((item) => String(item.id) === String(id)) ?? null;
}
