import { useEffect, useMemo, useState } from 'react';
import { products as demoProducts } from '../data/mockProducts';
import { fetchPublicProducts } from '../utils/products';

/**
 * Combines real seller products from Supabase with the existing demo
 * catalog (src/data/mockProducts.js), so /produk and /produk/:id show
 * whatever sellers have actually added on top of the placeholder listings
 * used for browsing/demoing the UI.
 *
 * Real products are listed first. If the fetch fails (e.g. offline, RLS,
 * a schema mismatch), this falls back to just the demo catalog — but logs
 * the real error to the console instead of swallowing it, since a silent
 * failure here looks exactly like "my product didn't show up".
 */
export function usePublicProducts() {
  const [realProducts, setRealProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    fetchPublicProducts()
      .then((rows) => {
        if (active) setRealProducts(rows);
      })
      .catch((err) => {
        if (!active) return;
        console.error('fetchPublicProducts failed — falling back to demo catalog only:', err);
        setError(err);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const products = useMemo(() => [...realProducts, ...demoProducts], [realProducts]);

  return { products, isLoading, error };
}

export function findProductById(list, id) {
  return list.find((item) => String(item.id) === String(id)) ?? null;
}

export function getRelatedProducts(list, product, limit = 8) {
  if (!product) return list.slice(0, limit);
  return list
    .filter((item) => item.id !== product.id)
    .filter((item) => item.category === product.category || item.petType === product.petType)
    .slice(0, limit);
}
