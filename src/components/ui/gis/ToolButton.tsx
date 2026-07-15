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
      className={`btn d-flex align-items-center justify-content-center p-2 rounded-3 border-0 transition-colors transition-transform ${
        isActive 
          ? "bg-success text-white shadow-sm hover-shadow" 
          : "bg-transparent text-secondary hover-bg-light"
      } ${className}`}
      style={{
        width: "40px",
        height: "40px",
        outline: "none",
        boxShadow: isActive ? "0 4px 6px -1px rgba(34, 197, 94, 0.4)" : "none",
      }}
    >
      {icon}
    </button>
  );
}
