import { useEffect, useState } from 'react';
import { fetchPublicProducts } from '../utils/products';
import { describeError } from '../lib/errors';

/**
 * Loads real seller products from Supabase for /produk and /produk/:id.
 * No demo/mock fallback — only what sellers have actually added via the
 * dashboard ever shows here. If the fetch fails (e.g. offline, RLS, a
 * schema mismatch), the list is simply empty — but the real error is
 * still logged to the console instead of swallowed, since a silent
 * failure here looks exactly like "my product didn't show up".
 */
export function usePublicProducts() {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    fetchPublicProducts()
      .then((rows) => {
        if (active) setProducts(rows);
      })
      .catch((err) => {
        if (!active) return;
        console.error('fetchPublicProducts failed:', describeError(err));
        setError(err);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

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