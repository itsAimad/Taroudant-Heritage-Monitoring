import { useCallback, useEffect, useState } from 'react';

export type ToastType = 'success' | 'error';

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

export const useToast = () => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((current) => current.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (toast: { message: string; type: ToastType }) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const item: ToastItem = { id, ...toast };
      setToasts((current) => [...current, item]);

      setTimeout(() => {
        dismissToast(id);
      }, 4000);
    },
    [dismissToast],
  );

  return { toasts, showToast, dismissToast };
};


