import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { savedAddresses } from '../data/mockCheckout';
import { apiDelete, apiGet, apiPatch, apiPost } from '../lib/apiClient';
import { useAuth } from './AuthContext';

const STORAGE_KEY = 'furkeeper_addresses';
const AddressContext = createContext(null);

function readAddresses() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const addresses = raw ? JSON.parse(raw) : savedAddresses;
    return Array.isArray(addresses)
      ? addresses.filter((address) => String(address.id || '').startsWith('addr-'))
      : savedAddresses;
  } catch {
    return savedAddresses;
  }
}

function persist(addresses) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(addresses));
  } catch {
    // Ignore storage errors; the list still works in memory.
  }
}

function withSingleDefault(list, defaultId) {
  return list.map((item) => ({ ...item, isDefault: item.id === defaultId }));
}

function isServerId(id) {
  return Boolean(id) && !String(id).startsWith('addr-');
}

export function AddressProvider({ children }) {
  const { user, isLoading: authLoading } = useAuth();
  const [addresses, setAddresses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    let active = true;

    const loadAddresses = async () => {
      if (authLoading) return;
      await Promise.resolve();
      if (!active) return;

      if (!user?.id) {
        const cached = readAddresses();
        setAddresses(cached.length ? cached : savedAddresses);
        setLoadError('');
        setIsLoading(false);
        return;
      }

      setAddresses([]);
      setLoadError('');
      setIsLoading(true);
      persist([]);
      try {
        const rows = await apiGet('/api/addresses');
        if (!active) return;
        setAddresses(rows);
      } catch (error) {
        if (!active) return;
        console.error('Gagal memuat alamat tersimpan:', error);
        setAddresses([]);
        setLoadError(error?.message || 'Gagal memuat alamat tersimpan.');
      } finally {
        if (active) setIsLoading(false);
      }
    };

    loadAddresses();

    return () => {
      active = false;
    };
  }, [authLoading, user?.id]);

  const addAddress = useCallback(async (address) => {
    const payload = {
      label: address.label,
      name: address.name,
      phone: address.phone,
      address: address.address,
      city: address.city || 'Malang',
      district: address.district,
      postalCode: address.postalCode,
      isDefault: Boolean(address.isDefault),
    };

    const saved = user?.id
      ? await apiPost('/api/addresses', payload)
      : { ...payload, id: address.id || `addr-${Date.now()}` };

    setAddresses((prev) => {
      const nextItem = { ...saved, city: saved.city || 'Malang' };
      let next = [...prev.filter((item) => item.id !== nextItem.id), nextItem];
      if (nextItem.isDefault) next = withSingleDefault(next, nextItem.id);
      if (!user?.id) persist(next);
      return next;
    });
    setLoadError('');
    return saved;
  }, [user?.id]);

  const updateAddress = useCallback(async (id, patch) => {
    let saved = null;
    if (isServerId(id)) {
      try {
        saved = await apiPatch(`/api/addresses/${encodeURIComponent(id)}`, patch);
      } catch {
        saved = null;
      }
    }

    setAddresses((prev) => {
      let next = prev.map((item) =>
        item.id === id ? { ...item, ...(saved || patch), city: (saved || patch).city || item.city } : item,
      );
      if (patch.isDefault) next = withSingleDefault(next, id);
      if (!user?.id) persist(next);
      return next;
    });
    return saved;
  }, [user?.id]);

  const removeAddress = useCallback(async (id) => {
    if (isServerId(id)) {
      try {
        await apiDelete(`/api/addresses/${encodeURIComponent(id)}`);
      } catch {
        // Still remove it locally so the UI is not stuck.
      }
    }

    setAddresses((prev) => {
      const next = prev.filter((item) => item.id !== id);
      if (next.length && !next.some((item) => item.isDefault)) {
        next[0] = { ...next[0], isDefault: true };
      }
      if (!user?.id) persist(next);
      return next;
    });
  }, [user?.id]);

  const setDefault = useCallback(
    async (id) => {
      if (isServerId(id)) {
        try {
          await apiPatch(`/api/addresses/${encodeURIComponent(id)}`, { action: 'default' });
        } catch {
          // Fall through to the local update.
        }
      }
      setAddresses((prev) => {
        const next = withSingleDefault(prev, id);
        if (!user?.id) persist(next);
        return next;
      });
    },
    [user?.id],
  );

  const value = useMemo(
    () => ({ addresses, addAddress, updateAddress, removeAddress, setDefault, isLoading, loadError }),
    [addresses, addAddress, updateAddress, removeAddress, setDefault, isLoading, loadError],
  );

  return <AddressContext.Provider value={value}>{children}</AddressContext.Provider>;
}

export function useAddresses() {
  const context = useContext(AddressContext);
  if (!context) {
    throw new Error('useAddresses must be used within AddressProvider');
  }
  return context;
}
