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
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget && closeOnBackdropClick) onClose();
  };

  const maxWidthClass = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-2xl",
    xl: "max-w-5xl",
  }[size];

  const iconClass =
    variant === "success"
      ? "bg-emerald-50 text-emerald-700"
      : variant === "dark"
        ? "bg-slate-100 text-slate-700"
        : "bg-[var(--brand-gold-soft)] text-[var(--brand-gold-text)]";

  const defaultIcon =
    variant === "success" ? (
      <CheckCircle2 size={22} />
    ) : variant === "dark" ? (
      <AlertCircle size={22} />
    ) : (
      <Info size={22} />
    );

  return (
    <div
      className="fixed inset-0 z-[1400] flex items-end justify-center bg-slate-950/45 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className={`flex max-h-[92dvh] w-full ${maxWidthClass} flex-col overflow-hidden rounded-t-3xl border border-[var(--border-color)] bg-white shadow-[var(--shadow-lg)] sm:rounded-3xl`}
      >
        <div className="flex items-start gap-3 border-b border-[var(--border-color)] px-4 py-4 sm:gap-4 sm:px-6 sm:py-5">
          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${iconClass}`}>
            {icon || defaultIcon}
          </div>
          <div className="min-w-0 flex-1 pt-0.5">
            <h2 className="text-lg font-extrabold leading-tight text-[var(--foreground)] sm:text-xl">
              {title}
            </h2>
            {description ? (
              <p className="mt-1 text-sm leading-6 text-[var(--muted-foreground)]">{description}</p>
            ) : null}
          </div>
          <button
            type="button"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--border-color)] text-[var(--muted-foreground)] transition-colors hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
            onClick={onClose}
            aria-label="বন্ধ করুন"
          >
            <X size={19} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 text-[var(--foreground)] sm:px-6 sm:py-6">
          {children}
        </div>

        {footer ? (
          <div className="flex flex-wrap justify-end gap-2 border-t border-[var(--border-color)] bg-[#fafafa] px-4 py-3 sm:gap-3 sm:px-6 sm:py-4">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
};
