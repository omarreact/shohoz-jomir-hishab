"use client";

import { Toaster } from "@/src/shared/ui/sonner";
import { toast as sonnerToast } from "sonner";

export type ToastType = "success" | "error" | "warning" | "info";

export interface Toast {
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastProviderProps {
  children: React.ReactNode;
}

export function showToast(toast: Toast) {
  const options = {
    duration: toast.duration || 4000,
    description: toast.message,
  };

  switch (toast.type) {
    case "success":
      sonnerToast.success(toast.title, options);
      break;
    case "error":
      sonnerToast.error(toast.title, options);
      break;
    case "warning":
      sonnerToast.warning(toast.title, options);
      break;
    case "info":
      sonnerToast.info(toast.title, options);
      break;
    default:
      sonnerToast(toast.title, options);
  }
}

export default function ToastProvider({ children }: ToastProviderProps) {
  return (
    <>
      {children}
      <Toaster richColors position="top-right" />
    </>
  );
}
