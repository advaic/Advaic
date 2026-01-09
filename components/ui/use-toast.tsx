"use client";

import { createContext, useContext, useState, useCallback } from "react";

type Toast = {
  id: number;
  message: string;
};

const ToastContext = createContext<{
  showToast: (message: string) => void;
}>({ showToast: () => {} });

export const useToast = () => useContext(ToastContext);

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-4 right-4 space-y-2 z-50">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="bg-gray-800 text-white px-4 py-2 rounded shadow"
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
