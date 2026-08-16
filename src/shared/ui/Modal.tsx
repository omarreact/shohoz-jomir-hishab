import React, { useEffect } from "react";
import { X, CheckCircle2, AlertCircle, Info } from "lucide-react";

export type ModalVariant = "standard" | "success" | "dark";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  variant?: ModalVariant;
  icon?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  closeOnBackdropClick?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  variant = "standard",
  icon,
  children,
  footer,
  size = "md",
  closeOnBackdropClick = true,
}) => {
  // Prevent body scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && closeOnBackdropClick) {
      onClose();
    }
  };

  // Determine styles based on variant
  let textColor = "text-slate-900 dark:text-white";
  let descColor = "text-slate-500 dark:text-slate-400";
  let borderClass = "border-b border-slate-200 dark:border-slate-800";
  let iconContainerClass = "bg-[#006a4e]/10 text-[#006a4e]";
  let customBg = "bg-white dark:bg-slate-900";

  if (variant === "success") {
    iconContainerClass = "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
  } else if (variant === "dark") {
    textColor = "text-white";
    descColor = "text-slate-300";
    iconContainerClass = "bg-blue-500/20 text-blue-400";
    customBg = "bg-slate-900";
    borderClass = "border-b border-slate-800";
  }

  // Determine size
  let maxWidthClass = "max-w-md";
  if (size === "sm") maxWidthClass = "max-w-sm";
  if (size === "lg") maxWidthClass = "max-w-2xl";
  if (size === "xl") maxWidthClass = "max-w-5xl";

  const defaultIcon =
    variant === "success" ? (
      <CheckCircle2 size={24} />
    ) : variant === "dark" ? (
      <AlertCircle size={24} />
    ) : (
      <Info size={24} />
    );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`w-full ${maxWidthClass} ${customBg} rounded-3xl shadow-xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200`}
      >
        {/* Header */}
        <div className={`p-6 flex items-start gap-4 ${borderClass}`}>
          <div
            className={`rounded-full flex items-center justify-center p-3 shrink-0 ${iconContainerClass}`}
          >
            {icon || defaultIcon}
          </div>
          <div className="flex-grow pt-1">
            <h5 className={`font-bold text-xl mb-1 ${textColor}`}>{title}</h5>
            {description && (
              <p className={`text-sm m-0 ${descColor}`}>{description}</p>
            )}
          </div>
          <button
            type="button"
            className="rounded-full p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors shrink-0"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div
          className={`p-6 overflow-y-auto ${textColor}`}
          style={{ flex: "1 1 auto" }}
        >
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div
            className={`p-6 ${
              variant === "dark"
                ? "border-t border-slate-800"
                : "border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50"
            } rounded-b-3xl flex justify-end gap-3`}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
