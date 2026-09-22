import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { seedBookings, seedOrders } from '../data/mockHistory';

const STORAGE_KEY = 'furkeeper_history';
const HistoryContext = createContext(null);

function defaultState() {
  return { orders: seedOrders, bookings: seedBookings };
}

function mergeById(stored = [], seeds = []) {
  const ids = new Set(stored.map((item) => item.id));
  return [...stored, ...seeds.filter((item) => !ids.has(item.id))];
}

function readHistory() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    return {
      orders: mergeById(parsed.orders || [], seedOrders),
      bookings: mergeById(parsed.bookings || [], seedBookings),
    };
  } catch {
    return defaultState();
  }
}

function persist(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function HistoryProvider({ children }) {
  const [state, setState] = useState(() =>
    typeof window === 'undefined' ? defaultState() : readHistory(),
  );

  const upsertOrder = useCallback((order) => {
    setState((prev) => {
      const next = {
        ...prev,
        orders: [order, ...prev.orders.filter((item) => item.id !== order.id)],
      };
      persist(next);
      return next;
    });
  }, []);

  const upsertBooking = useCallback((booking) => {
    setState((prev) => {
      const next = {
        ...prev,
        bookings: [booking, ...prev.bookings.filter((item) => item.id !== booking.id)],
      };
      persist(next);
      return next;
    });
  }, []);

  const updateOrder = useCallback((id, patch) => {
    setState((prev) => {
      const next = {
        ...prev,
        orders: prev.orders.map((item) => (item.id === id ? { ...item, ...patch } : item)),
      };
      persist(next);
      return next;
    });
  }, []);

  const updateBooking = useCallback((id, patch) => {
    setState((prev) => {
      const next = {
        ...prev,
        bookings: prev.bookings.map((item) => (item.id === id ? { ...item, ...patch } : item)),
      };
      persist(next);
      return next;
    });
  }, []);

  const getOrder = useCallback((id) => state.orders.find((item) => item.id === id) || null, [state.orders]);
  const getBooking = useCallback(
    (id) => state.bookings.find((item) => item.id === id) || null,
    [state.bookings],
  );

  const submitReview = useCallback((type, id) => {
    if (type === 'product') updateOrder(id, { reviewed: true });
    else updateBooking(id, { reviewed: true });
  }, [updateBooking, updateOrder]);

  const value = useMemo(
    () => ({
      orders: state.orders,
      bookings: state.bookings,
      upsertOrder,
      upsertBooking,
      updateOrder,
      updateBooking,
      getOrder,
      getBooking,
      submitReview,
    }),
    [state, upsertOrder, upsertBooking, updateOrder, updateBooking, getOrder, getBooking, submitReview],
  );

  return <HistoryContext.Provider value={value}>{children}</HistoryContext.Provider>;
}

export function useOrderHistory() {
  const context = useContext(HistoryContext);
  if (!context) {
    throw new Error('useOrderHistory must be used within HistoryProvider');
  }
  return context;
}
