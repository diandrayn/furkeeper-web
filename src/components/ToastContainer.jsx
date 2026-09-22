import Toast from './Toast';
import { useNotifications } from '../hooks/useNotifications';

export default function ToastContainer() {
  const { toasts, dismissToast } = useNotifications();

  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[100] flex flex-col items-center gap-2 px-4 sm:inset-x-auto sm:right-4 sm:items-end">
      {toasts.map((toast) => (
        <Toast key={toast.id} notification={toast} onDismiss={dismissToast} />
      ))}
    </div>
  );
}