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
      className={`bg-white rounded-4 shadow-lg overflow-hidden d-flex flex-column animate-slide-in-left ${className}`}
      style={{
        border: "1px solid rgba(0,0,0,0.08)",
        pointerEvents: "auto",
        ...style
      }}
    >
      <div className="d-flex align-items-center justify-content-between p-3 bg-light border-bottom">
        <h6 className="mb-0 fw-bold d-flex align-items-center gap-2">
          {icon && <span className="text-success">{icon}</span>}
          {title}
        </h6>
        {onClose && (
          <button 
            className="btn btn-sm btn-link text-muted p-0 border-0 hover-text-success transition-colors" 
            onClick={onClose}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        )}
      </div>
      <div className="flex-grow-1 overflow-auto p-3 bg-white d-flex flex-column gap-3">
        {children}
      </div>
    </div>
  );
}
