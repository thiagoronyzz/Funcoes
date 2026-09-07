"use client";

import React, { createContext, useContext, useState, useCallback, type ReactNode } from "react";

interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info";
}

interface ToastContextType {
  showToast: (message: string, type?: "success" | "error" | "info") => void;
}

const ToastContext = createContext<ToastContextType>({
  showToast: () => {},
});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback(
    (message: string, type: "success" | "error" | "info" = "info") => {
      const id = Math.random().toString(36).slice(2);
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3500);
    },
    []
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto px-4 py-3 rounded text-sm font-medium shadow-lg border"
            style={{
              backgroundColor:
                toast.type === "error"
                  ? "#f5ede9"
                  : toast.type === "success"
                  ? "#f0f5ed"
                  : "#f5f0e8",
              borderColor:
                toast.type === "error"
                  ? "#c0614e"
                  : toast.type === "success"
                  ? "#6b8f5e"
                  : "#c9a84c",
              color:
                toast.type === "error"
                  ? "#a8503f"
                  : toast.type === "success"
                  ? "#4a6e3f"
                  : "#7d6e5e",
            }}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
