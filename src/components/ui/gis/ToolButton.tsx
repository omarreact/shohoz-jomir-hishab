import React from "react";

interface ToolButtonProps {
  icon: React.ReactNode;
  label: string;
  isActive?: boolean;
  onClick: () => void;
  className?: string;
}

export function ToolButton({ icon, label, isActive, onClick, className = "" }: ToolButtonProps) {
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      aria-pressed={isActive}
      className={`flex items-center justify-center p-2 rounded-lg border-0 transition-colors transition-transform ${ isActive ? "bg-primary text-slate-900 shadow-sm hover-shadow" : "bg-transparent text-white bg-opacity-10" } ${className}`}
      style={{
        width: "40px",
        height: "40px",
        outline: "none",
        boxShadow: isActive ? "0 4px 6px -1px rgba(246, 195, 67, 0.4)" : "none",
      }}
    >
      {icon}
    </button>
  );
}
