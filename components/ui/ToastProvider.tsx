"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { CheckCircle2, AlertCircle, Info, XCircle, X } from "lucide-react";

type ToastType = "success" | "error" | "info" | "warning";

interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
}

interface ToastContextType {
  toast: (options: Omit<ToastMessage, "id">) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((options: Omit<ToastMessage, "id">) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { ...options, id }]);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      removeToast(id);
    }, 5000);
  }, [removeToast]);

  const success = (title: string, message?: string) => toast({ type: "success", title, message });
  const error = (title: string, message?: string) => toast({ type: "error", title, message });
  const info = (title: string, message?: string) => toast({ type: "info", title, message });
  const warning = (title: string, message?: string) => toast({ type: "warning", title, message });

  return (
    <ToastContext.Provider value={{ toast, success, error, info, warning }}>
      {children}
      
      {/* Toast Container */}
      <div className="position-fixed bottom-0 end-0 p-3" style={{ zIndex: 1090 }}>
        {toasts.map((t) => (
          <div 
            key={t.id} 
            className="toast show align-items-center border-0 shadow-lg mb-2 rounded-3 overflow-hidden transition-all bg-body"
            role="alert" 
            aria-live="assertive" 
            aria-atomic="true"
          >
            <div className="d-flex position-relative">
              {/* Type Indicator Line */}
              <div 
                className="position-absolute top-0 bottom-0 start-0" 
                style={{ 
                  width: "4px",
                  backgroundColor: 
                    t.type === "success" ? "var(--bs-success)" : 
                    t.type === "error" ? "var(--bs-danger)" : 
                    t.type === "warning" ? "var(--bs-warning)" : "var(--bs-info)"
                }} 
              />
              
              <div className="toast-body d-flex align-items-start p-3 ps-4">
                <div className="me-3 mt-1">
                  {t.type === "success" && <CheckCircle2 className="text-success" size={20} />}
                  {t.type === "error" && <XCircle className="text-danger" size={20} />}
                  {t.type === "warning" && <AlertCircle className="text-warning" size={20} />}
                  {t.type === "info" && <Info className="text-info" size={20} />}
                </div>
                <div className="flex-grow-1">
                  <strong className="d-block text-body mb-1">{t.title}</strong>
                  {t.message && <div className="text-muted small">{t.message}</div>}
                </div>
                <button 
                  type="button" 
                  className="btn-close btn-close-sm ms-2 mt-1 m-auto" 
                  onClick={() => removeToast(t.id)}
                  aria-label="Close"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
