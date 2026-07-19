import React, { useEffect } from "react";
import { X, CheckCircle2, AlertCircle, Info } from "lucide-react";
import { Button } from "./button";

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
  let textColor = "text-body";
  let descColor = "text-muted";
  let borderClass = "border-bottom border-secondary border-opacity-25";
  let iconContainerClass = "bg-primary bg-opacity-10 text-primary";
  let closeBtnClass = "btn-close btn-close-white";
  let customBg = "var(--card-bg)";

  if (variant === "success") {
    iconContainerClass = "bg-success bg-opacity-10 text-success";
  } else if (variant === "dark") {
    textColor = "text-white";
    descColor = "text-light opacity-75";
    iconContainerClass = "bg-primary bg-opacity-25 text-primary";
    customBg = "var(--card-bg-secondary)";
  }

  // Determine size
  let maxWidthClass = "max-w-md";
  if (size === "sm") maxWidthClass = "max-w-sm";
  if (size === "lg") maxWidthClass = "max-w-lg";
  if (size === "xl") maxWidthClass = "max-w-xl";

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
      className="position-fixed top-0 start-0 w-100 h-100 z-3 d-flex align-items-center justify-content-center"
      style={{
        backgroundColor: "rgba(15, 23, 42, 0.6)",
        backdropFilter: "blur(4px)",
        zIndex: 1050,
      }}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`card border-0 shadow-lg animate-slide-up`}
        style={{
          backgroundColor: customBg,
          width: "90%",
          maxWidth:
            size === "sm"
              ? "400px"
              : size === "lg"
                ? "800px"
                : size === "xl"
                  ? "1140px"
                  : "500px",
          borderRadius: "var(--radius-xl)",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <div className={`p-4 d-flex align-items-start gap-3 ${borderClass}`}>
          <div
            className={`rounded-circle d-flex align-items-center justify-content-center p-2 flex-shrink-0 ${iconContainerClass}`}
          >
            {icon || defaultIcon}
          </div>
          <div className="flex-grow-1">
            <h5 className={`fw-bold mb-1 ${textColor}`}>{title}</h5>
            {description && (
              <p className={`mb-0 small ${descColor}`}>{description}</p>
            )}
          </div>
          <button
            type="button"
            className={closeBtnClass}
            onClick={onClose}
            aria-label="Close"
          ></button>
        </div>

        {/* Body */}
        <div
          className={`p-4 overflow-auto ${textColor}`}
          style={{ flex: "1 1 auto" }}
        >
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div
            className={`p-4 ${variant === "dark" ? "border-top border-secondary border-opacity-25" : "border-top bg-light bg-opacity-50"} rounded-bottom-4 d-flex justify-content-end gap-2`}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
