import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { seedNotifications } from '../data/mockNotifications';

const STORAGE_KEY = 'furkeeper_notifications';
const NotificationContext = createContext(null);

function mergeById(stored = [], seeds = []) {
  const ids = new Set(stored.map((item) => item.id));
  return [...stored, ...seeds.filter((item) => !ids.has(item.id))];
}

function readStored() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return seedNotifications;
    const parsed = JSON.parse(raw);
    return mergeById(parsed, seedNotifications);
  } catch {
    return seedNotifications;
  }
}

function persist(notifications) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
}

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState(() =>
    typeof window === 'undefined' ? seedNotifications : readStored(),
  );
  const [toasts, setToasts] = useState([]);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const pushNotification = useCallback((notification) => {
    setNotifications((prev) => {
      const next = [notification, ...prev];
      persist(next);
      return next;
    });
    setToasts((prev) => [...prev, notification]);
  }, []);

  const markAsRead = useCallback((id) => {
    setNotifications((prev) => {
      const next = prev.map((item) => (item.id === id ? { ...item, isRead: true } : item));
      persist(next);
      return next;
    });
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => {
      const next = prev.map((item) => ({ ...item, isRead: true }));
      persist(next);
      return next;
    });
  }, []);

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.isRead).length,
    [notifications],
  );

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      markAsRead,
      markAllAsRead,
      pushNotification,
      toasts,
      dismissToast,
    }),
    [notifications, unreadCount, markAsRead, markAllAsRead, pushNotification, toasts, dismissToast],
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
}