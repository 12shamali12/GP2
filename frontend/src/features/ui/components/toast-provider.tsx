"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

type ToastKind = "success" | "error" | "info";

type ToastInput = {
  kind?: ToastKind;
  title?: string;
  description: string;
  duration?: number;
};

type ToastItem = ToastInput & {
  id: string;
  kind: ToastKind;
};

type ToastContextValue = {
  pushToast: (toast: ToastInput) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const KIND_LABELS: Record<ToastKind, string> = {
  success: "Saved",
  error: "Attention",
  info: "Notice",
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timersRef = useRef<Record<string, number>>({});

  const dismissToast = useCallback((id: string) => {
    const timer = timersRef.current[id];
    if (timer) {
      window.clearTimeout(timer);
      delete timersRef.current[id];
    }
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const pushToast = useCallback(
    ({ kind = "info", duration = 5000, ...toast }: ToastInput) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      const nextToast: ToastItem = {
        id,
        kind,
        title: toast.title || KIND_LABELS[kind],
        description: toast.description,
        duration,
      };

      setToasts((current) => [...current, nextToast]);
      timersRef.current[id] = window.setTimeout(() => dismissToast(id), duration);
    },
    [dismissToast],
  );

  const value = useMemo(() => ({ pushToast }), [pushToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="denty-toast-stack" aria-live="polite" aria-atomic="true">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`denty-toast denty-toast-${toast.kind}`}
            role={toast.kind === "error" ? "alert" : "status"}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="denty-toast-title">{toast.title}</p>
                <p className="denty-toast-description">{toast.description}</p>
              </div>
              <button
                type="button"
                onClick={() => dismissToast(toast.id)}
                className="denty-toast-close"
                aria-label="Dismiss notification"
              >
                x
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used inside ToastProvider.");
  }
  return context;
}
