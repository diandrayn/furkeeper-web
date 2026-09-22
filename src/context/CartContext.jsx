import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'furkeeper_cart';
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

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => (typeof window === 'undefined' ? [] : readCart()));

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

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
