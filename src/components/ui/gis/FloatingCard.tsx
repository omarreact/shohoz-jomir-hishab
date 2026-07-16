import React from "react";
import { X } from "lucide-react";

interface FloatingCardProps {
  title: string;
  icon?: React.ReactNode;
  onClose?: () => void;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function FloatingCard({ title, icon, onClose, children, className = "", style = {} }: FloatingCardProps) {
  return (
    <div
      role="dialog"
      aria-label={title}
      className={`rounded-4 shadow-lg overflow-hidden d-flex flex-column animate-slide-in-left ${className}`}
      style={{
        border: "1px solid var(--border-color)",
        backgroundColor: "var(--card-bg)",
        pointerEvents: "auto",
        ...style
      }}
    >
      <div className="d-flex align-items-center justify-content-between p-3 border-bottom border-secondary border-opacity-25" style={{ backgroundColor: "var(--card-bg-secondary)" }}>
        <h6 className="mb-0 fw-bold d-flex align-items-center gap-2 text-white">
          {icon && <span className="text-primary">{icon}</span>}
          {title}
        </h6>
        {onClose && (
          <button 
            className="btn btn-sm btn-link text-secondary p-0 border-0 hover-text-primary transition-colors" 
            onClick={onClose}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        )}
      </div>
      <div className="flex-grow-1 overflow-auto p-3 d-flex flex-column gap-3 text-white">
        {children}
      </div>
    </div>
  );
}
