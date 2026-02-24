"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

type ToastVariant = "success" | "error" | "info";

type ToastItem = {
  id: string;
  description: string;
  variant: ToastVariant;
};

type ToastInput = {
  description: string;
  variant?: ToastVariant;
};

type ToastContextValue = {
  toast: (input: ToastInput) => void;
  success: (description: string) => void;
  error: (description: string) => void;
  info: (description: string) => void;
  toastMessage: (message: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

function classifyMessage(message: string): ToastVariant {
  const value = message.toLowerCase();
  if (
    value.includes("error") ||
    value.includes("failed") ||
    value.includes("forbidden") ||
    value.includes("unauthorized")
  ) {
    return "error";
  }
  if (
    value.includes("saved") ||
    value.includes("success") ||
    value.includes("created") ||
    value.includes("updated") ||
    value.includes("deleted") ||
    value.includes("removed") ||
    value.includes("generated") ||
    value.includes("completed")
  ) {
    return "success";
  }
  return "info";
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const toast = useCallback(
    (input: ToastInput) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const item: ToastItem = {
        id,
        description: input.description,
        variant: input.variant ?? "info",
      };
      setToasts((prev) => [item, ...prev].slice(0, 5));
      setTimeout(() => removeToast(id), 4500);
    },
    [removeToast]
  );

  const value = useMemo<ToastContextValue>(
    () => ({
      toast,
      success: (description: string) => toast({ description, variant: "success" }),
      error: (description: string) => toast({ description, variant: "error" }),
      info: (description: string) => toast({ description, variant: "info" }),
      toastMessage: (message: string) => toast({ description: message, variant: classifyMessage(message) }),
    }),
    [toast]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed top-4 right-4 z-[110] flex w-[360px] max-w-[calc(100vw-1rem)] flex-col gap-2">
        {toasts.map((item) => {
          const tone =
            item.variant === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : item.variant === "error"
              ? "border-rose-200 bg-rose-50 text-rose-800"
              : "border-slate-200 bg-white text-slate-800";
          return (
            <div
              key={item.id}
              className={`pointer-events-auto rounded-lg border px-3 py-2 text-sm shadow-lg ${tone}`}
              role="status"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="leading-5">{item.description}</p>
                <button
                  type="button"
                  onClick={() => removeToast(item.id)}
                  className="rounded px-1 text-xs font-semibold opacity-70 hover:opacity-100"
                  aria-label="Close toast"
                >
                  x
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}

