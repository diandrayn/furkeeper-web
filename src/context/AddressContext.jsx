import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { savedAddresses } from '../data/mockCheckout';

const STORAGE_KEY = 'furkeeper_addresses';
const AddressContext = createContext(null);

function readAddresses() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : savedAddresses;
  } catch {
    return savedAddresses;
  }
}

function persist(addresses) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(addresses));
}

function withSingleDefault(list, defaultId) {
  return list.map((item) => ({ ...item, isDefault: item.id === defaultId }));
}

export function AddressProvider({ children }) {
  const [addresses, setAddresses] = useState(savedAddresses);

  useEffect(() => { setAddresses(readAddresses()); }, []);

  const addAddress = useCallback((address) => {
    setAddresses((prev) => {
      const nextItem = {
        city: 'Malang',
        ...address,
        isDefault: prev.length === 0 ? true : Boolean(address.isDefault),
      };
      let next = [...prev, nextItem];
      if (nextItem.isDefault) next = withSingleDefault(next, nextItem.id);
      persist(next);
      return next;
    });
  }, []);

  const updateAddress = useCallback((id, patch) => {
    setAddresses((prev) => {
      let next = prev.map((item) => (item.id === id ? { ...item, ...patch } : item));
      if (patch.isDefault) next = withSingleDefault(next, id);
      persist(next);
      return next;
    });
  }, []);

  const removeAddress = useCallback((id) => {
    setAddresses((prev) => {
      const next = prev.filter((item) => item.id !== id);
      if (next.length && !next.some((item) => item.isDefault)) {
        next[0] = { ...next[0], isDefault: true };
      }
      persist(next);
      return next;
    });
  }, []);

  const setDefault = useCallback((id) => {
    setAddresses((prev) => {
      const next = withSingleDefault(prev, id);
      persist(next);
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ addresses, addAddress, updateAddress, removeAddress, setDefault }),
    [addresses, addAddress, updateAddress, removeAddress, setDefault],
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
