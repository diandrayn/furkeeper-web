import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  seedStoreProfile,
  seedProviderProfile,
  seedMyProducts,
  seedMyServices,
} from '../data/mockDashboard';
import { useAuth } from '../hooks/useAuth';
import {
  ensureMyStore,
  fetchMyProducts,
  insertProduct,
  updateProductRow,
  deleteProductRow,
  uploadProductImage,
} from '../utils/products';
import {
  ensureMyServiceStore,
  fetchMyServices,
  insertService,
  updateServiceRow,
  deleteServiceRow,
  uploadServiceImage,
} from '../utils/services';
import {
  fetchMyStoreProfile,
  saveStoreProfile,
  uploadStoreImage,
} from '../utils/stores';

const STORAGE_KEY = 'furkeeper_dashboard_v1';

// `products` and `services` used to live in this same localStorage blob as
// everything else here — they've been pulled out below into their own
// Supabase-backed state, so they're intentionally left out of
// defaultState/persist now (an old localStorage array would otherwise mask
// what's actually in the database on next load).
function defaultState() {
  const products = seedMyProducts();
  const services = seedMyServices();
  return {
    storeProfile: seedStoreProfile,
    providerProfile: seedProviderProfile,
  };
}

function readStored() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    const seeds = defaultState();
    return { ...seeds, ...parsed };
  } catch {
    return defaultState();
  }
}

function persist(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore quota errors in demo */
  }
}

export const DashboardContext = createContext(null);

export function DashboardProvider({ children }) {
  const { user } = useAuth();
  const [state, setState] = useState(() =>
    typeof window === 'undefined' ? defaultState() : readStored(),
  );

  // --- Produk (toko) — real Supabase data, kept separate from the
  // localStorage-mocked `state` above. ---
  const [products, setProducts] = useState([]);
  const [storeId, setStoreId] = useState(null);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [productsError, setProductsError] = useState(null);

  useEffect(() => {
    // Only sellers with an approved application have a store/products at
    // all — DashboardProvider wraps the whole app, so this effect would
    // otherwise fire (and fail RLS) for every buyer too.
    if (user?.sellerStatus !== 'active') {
      setProducts([]);
      setStoreId(null);
      return;
    }
    let active = true;
    setIsLoadingProducts(true);
    setProductsError(null);
    (async () => {
      try {
        const id = await ensureMyStore(user);
        const rows = await fetchMyProducts(id);
        if (!active) return;
        setStoreId(id);
        setProducts(rows);
      } catch (err) {
        if (active) setProductsError(err.message || 'Gagal memuat produk.');
      } finally {
        if (active) setIsLoadingProducts(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [user?.id, user?.sellerStatus]);

  // --- Jasa (provider) — same pattern as products, separate store kind. ---
  const [services, setServices] = useState([]);
  const [serviceStoreId, setServiceStoreId] = useState(null);
  const [isLoadingServices, setIsLoadingServices] = useState(false);
  const [servicesError, setServicesError] = useState(null);

  useEffect(() => {
    if (user?.providerStatus !== 'active') {
      setServices([]);
      setServiceStoreId(null);
      return;
    }
    let active = true;
    setIsLoadingServices(true);
    setServicesError(null);
    (async () => {
      try {
        const id = await ensureMyServiceStore(user);
        const rows = await fetchMyServices(id);
        if (!active) return;
        setServiceStoreId(id);
        setServices(rows);
      } catch (err) {
        if (active) setServicesError(err.message || 'Gagal memuat layanan.');
      } finally {
        if (active) setIsLoadingServices(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [user?.id, user?.providerStatus]);

  const update = useCallback((updater) => {
    setState((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : { ...prev, ...updater };
      persist(next);
      return next;
    });
  }, []);

  // ---- Profil toko/jasa — when the application is active, load what's
  // actually in the `stores` table (merged over the demo seed) so the
  // dashboard form shows the real, public-facing profile. ---
  const [isLoadingProfiles, setIsLoadingProfiles] = useState(false);
  const [profileError, setProfileError] = useState(null);

  useEffect(() => {
    if (!user?.id || user?.sellerStatus !== 'active') return;
    let active = true;
    setIsLoadingProfiles(true);
    setProfileError(null);
    (async () => {
      try {
        const profile = await fetchMyStoreProfile(user, 'seller');
        if (!active || !profile) return;
        update((prev) => ({
          ...prev,
          storeProfile: {
            ...prev.storeProfile,
            ...profile,
            // The DB defaults operating_hours to [] — keep the demo seed
            // when the owner hasn't filled in opening times yet.
            operatingHours:
              profile.operatingHours.length > 0
                ? profile.operatingHours
                : prev.storeProfile.operatingHours,
          },
        }));
      } catch (err) {
        if (active) setProfileError(err.message || 'Gagal memuat profil toko.');
      } finally {
        if (active) setIsLoadingProfiles(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [user?.id, user?.sellerStatus]);

  useEffect(() => {
    if (!user?.id || user?.providerStatus !== 'active') return;
    let active = true;
    setIsLoadingProfiles(true);
    setProfileError(null);
    (async () => {
      try {
        const profile = await fetchMyStoreProfile(user, 'service');
        if (!active || !profile) return;
        update((prev) => ({
          ...prev,
          providerProfile: {
            ...prev.providerProfile,
            ...profile,
            operatingHours:
              profile.operatingHours.length > 0
                ? profile.operatingHours
                : prev.providerProfile.operatingHours,
          },
        }));
      } catch (err) {
        if (active) setProfileError(err.message || 'Gagal memuat profil bisnis.');
      } finally {
        if (active) setIsLoadingProfiles(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [user?.id, user?.providerStatus]);

  // ---- Produk (toko) — Supabase-backed ----
  const addProduct = useCallback(
    async (payload) => {
      const id = storeId || (await ensureMyStore(user));
      if (!storeId) setStoreId(id);
      let imageUrl = null;
      if (payload.imageFile) {
        imageUrl = await uploadProductImage(payload.imageFile, user.id);
      }
      const created = await insertProduct(id, { ...payload, imageUrl });
      setProducts((prev) => [created, ...prev]);
      return created;
    },
    [storeId, user],
  );

  const updateProduct = useCallback(
    async (id, payload) => {
      let imageUrl;
      if (payload.imageFile) {
        imageUrl = await uploadProductImage(payload.imageFile, user.id);
      }
      const updated = await updateProductRow(id, { ...payload, imageUrl });
      setProducts((prev) => prev.map((p) => (p.id === id ? updated : p)));
      return updated;
    },
    [user],
  );

  const deleteProduct = useCallback(async (id) => {
    await deleteProductRow(id);
    setProducts((prev) => prev.filter((p) => p.id !== id));
  }, []);

  // ---- Layanan (jasa) — Supabase-backed ----
  const addService = useCallback(
    async (payload) => {
      const id = serviceStoreId || (await ensureMyServiceStore(user));
      if (!serviceStoreId) setServiceStoreId(id);
      let imageUrl = null;
      if (payload.imageFile) {
        imageUrl = await uploadServiceImage(payload.imageFile, user.id);
      }
      const created = await insertService(id, { ...payload, imageUrl });
      setServices((prev) => [created, ...prev]);
      return created;
    },
    [serviceStoreId, user],
  );

  const updateService = useCallback(
    async (id, payload) => {
      let imageUrl;
      if (payload.imageFile) {
        imageUrl = await uploadServiceImage(payload.imageFile, user.id);
      }
      const updated = await updateServiceRow(id, { ...payload, imageUrl });
      setServices((prev) => prev.map((s) => (s.id === id ? updated : s)));
      return updated;
    },
    [user],
  );

  const deleteService = useCallback(async (id) => {
    await deleteServiceRow(id);
    setServices((prev) => prev.filter((s) => s.id !== id));
  }, []);

  // ---- Profil ----
  // Writes back to the `stores` table when the account has a real store
  // (active application), so the public /toko page reflects the form.
  // Image files (logoFile/bannerFile) are uploaded to the "store-images"
  // bucket first; the resulting public URLs then land on the row. Without
  // an active store yet (demo/seed usage) it only updates local state.
  const updateStoreProfile = useCallback(
    async (patch, { logoFile, bannerFile } = {}) => {
      update((prev) => ({ ...prev, storeProfile: { ...prev.storeProfile, ...patch } }));
      if (user?.sellerStatus !== 'active' || !storeId) return null;

      let logoUrl = patch.logoUrl;
      if (logoFile) logoUrl = await uploadStoreImage(logoFile, user.id);
      let bannerUrl = patch.bannerUrl;
      if (bannerFile) bannerUrl = await uploadStoreImage(bannerFile, user.id);

      const saved = await saveStoreProfile(storeId, { ...patch, logoUrl, bannerUrl });
      update((prev) => ({
        ...prev,
        storeProfile: {
          ...prev.storeProfile,
          logoUrl: saved.logoUrl || null,
          bannerUrl: saved.bannerUrl || null,
        },
      }));
      return saved;
    },
    [update, user, storeId],
  );

  const updateProviderProfile = useCallback(
    async (patch, { logoFile, bannerFile } = {}) => {
      update((prev) => ({ ...prev, providerProfile: { ...prev.providerProfile, ...patch } }));
      if (user?.providerStatus !== 'active' || !serviceStoreId) return null;

      let logoUrl = patch.logoUrl;
      if (logoFile) logoUrl = await uploadStoreImage(logoFile, user.id);
      let bannerUrl = patch.bannerUrl;
      if (bannerFile) bannerUrl = await uploadStoreImage(bannerFile, user.id);

      const saved = await saveStoreProfile(serviceStoreId, { ...patch, logoUrl, bannerUrl });
      update((prev) => ({
        ...prev,
        providerProfile: {
          ...prev.providerProfile,
          logoUrl: saved.logoUrl || null,
          bannerUrl: saved.bannerUrl || null,
        },
      }));
      return saved;
    },
    [update, user, serviceStoreId],
  );

  // ---- Ulasan dipindah ke bab penyedia yang membacanya langsung dari DB:
  // utils/reviews.js + utils/stores.js (reply via policy RLS "store owner
  // replies to reviews"). Tidak ada ulasan mock JSON di context ini lagi.

  const value = useMemo(
    () => ({
      ...state,
      products,
      storeId,
      isLoadingProducts,
      productsError,
      services,
      serviceStoreId,
      isLoadingServices,
      servicesError,
      addProduct,
      updateProduct,
      deleteProduct,
      addService,
      updateService,
      deleteService,
      isLoadingProfiles,
      profileError,
      updateStoreProfile,
      updateProviderProfile,
    }),
    [
      state,
      products,
      storeId,
      isLoadingProducts,
      productsError,
      services,
      serviceStoreId,
      isLoadingServices,
      servicesError,
      isLoadingProfiles,
      profileError,
      addProduct,
      updateProduct,
      deleteProduct,
      addService,
      updateService,
      deleteService,
      updateStoreProfile,
      updateProviderProfile,
    ],
  );

  return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>;
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used within DashboardProvider');
  }
  return context;
}
