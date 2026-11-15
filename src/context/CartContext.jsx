import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'furkeeper_cart';
const SNAPSHOT_KEY = 'furkeeper_cart_snapshot';
const CartContext = createContext(null);

function makeLineId(productId, variant) {
  return `${productId}::${variant || 'default'}`;
}

function mergeLine(items, payload) {
  const id = makeLineId(payload.productId, payload.variant);
  const existing = items.find((item) => item.id === id);
  if (existing) {
    return items.map((item) =>
      item.id === id
        ? {
            ...item,
            quantity: Math.min(item.stock || 99, item.quantity + payload.quantity),
            checked: true,
          }
        : item,
    );
  }

  return [
    ...items,
    {
      id,
      productId: payload.productId,
      name: payload.name,
      variant: payload.variant || '',
      price: payload.price,
      quantity: payload.quantity,
      storeName: payload.storeName,
      storeId: payload.storeId,
      stock: payload.stock || 99,
      checked: true,
    },
  ];
}

function readCart() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function readSnapshot() {
  try {
    const raw = localStorage.getItem(SNAPSHOT_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeSnapshot(items) {
  try {
    localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(items));
  } catch {
    // Storage can be unavailable (private mode/quota). Checkout still works.
  }
}

function clearSnapshot() {
  try {
    localStorage.removeItem(SNAPSHOT_KEY);
  } catch {
    // Ignore storage errors.
  }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => { setItems(readCart()); setLoaded(true); }, []);
  useEffect(() => { if (!loaded) return; localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); }, [items, loaded]);

  const value = useMemo(() => {
    const addItem = (payload) => {
      setItems((prev) => mergeLine(prev, payload));
    };

    const buyNow = (payload) => {
      const id = makeLineId(payload.productId, payload.variant);
      setItems((prev) =>
        mergeLine(prev, payload).map((item) => ({ ...item, checked: item.id === id })),
      );
    };

    const updateQuantity = (id, quantity) => {
      setItems((prev) =>
        prev.map((item) =>
          item.id === id
            ? { ...item, quantity: Math.max(1, Math.min(item.stock || 99, quantity)) }
            : item,
        ),
      );
    };

    const removeItem = (id) => {
      setItems((prev) => prev.filter((item) => item.id !== id));
    };

    const toggleItem = (id) => {
      setItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, checked: !item.checked } : item)),
      );
    };

    const toggleStore = (storeName, checked) => {
      setItems((prev) =>
        prev.map((item) => (item.storeName === storeName ? { ...item, checked } : item)),
      );
    };

    const removeChecked = () => {
      setItems((prev) => prev.filter((item) => !item.checked));
    };

    // Remember the items that were sent to checkout. The active cart is
    // cleared while payment is pending; a failed/expired payment keeps the
    // order alive (the buyer can pay again), so restoring is only offered as
    // an explicit action on the failed-payment page.
    const saveCheckoutSnapshot = (lines) => {
      const source = Array.isArray(lines) && lines.length ? lines : items.filter((item) => item.checked);
      writeSnapshot(source.map((item) => ({ ...item })));
      return source.length;
    };

    const restoreCheckoutSnapshot = () => {
      const snapshot = readSnapshot();
      if (!snapshot.length) return 0;
      setItems((prev) =>
        snapshot.reduce(
          (acc, line) =>
            mergeLine(acc, {
              productId: line.productId,
              name: line.name,
              variant: line.variant,
              price: line.price,
              quantity: line.quantity,
              storeName: line.storeName,
              storeId: line.storeId,
              stock: line.stock,
            }),
          prev,
        ),
      );
      clearSnapshot();
      return snapshot.length;
    };

    const clearCheckoutSnapshot = () => clearSnapshot();

    const selectedItems = items.filter((item) => item.checked);
    const selectedCount = selectedItems.reduce((sum, item) => sum + item.quantity, 0);
    const selectedSubtotal = selectedItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );

    return {
      items,
      addItem,
      buyNow,
      updateQuantity,
      removeItem,
      toggleItem,
      toggleStore,
      removeChecked,
      saveCheckoutSnapshot,
      restoreCheckoutSnapshot,
      clearCheckoutSnapshot,
      selectedItems,
      selectedCount,
      selectedSubtotal,
      itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    };
  }, [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
}
