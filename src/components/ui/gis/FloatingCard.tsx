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
      className={`rounded-xl shadow-lg overflow-hidden flex flex-col animate-slide-in-left bg-white dark:bg-slate-900 ${className}`}
    >
      <div className="flex items-center justify-between p-6 border-b border-slate-500 border-opacity-25 bg-slate-50 dark:bg-slate-950">
        <h6 className="mb-0 font-bold flex items-center gap-2 text-white">
          {icon && <span className="text-blue-600">{icon}</span>}
          {title}
        </h6>
        {onClose && (
          <button 
            className="px-3 py-1.5 text-sm text-blue-600 hover:underline bg-transparent border-0 text-slate-500 p-0 border-0 hover-text-primary transition-colors" 
            onClick={onClose}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        )}
      </div>
      <div className="grow overflow-auto p-6 flex flex-col gap-3 text-white">
        {children}
      </div>
    </div>
  );
}
