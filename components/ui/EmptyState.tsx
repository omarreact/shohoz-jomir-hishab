import React from "react";
import { FolderX } from "lucide-react";
import { Button } from "./button";

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  title,
  description,
  icon,
  actionLabel,
  onAction,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={`d-flex flex-column align-items-center justify-content-center text-center p-5 border rounded-4 bg-light ${className}`}
    >
      <div className="text-muted mb-4 p-4 rounded-circle bg-white shadow-sm d-inline-flex">
        {icon || <FolderX size={48} strokeWidth={1.5} />}
      </div>
      <h4 className="fw-bold text-body">{title}</h4>
      {description && (
        <p className="text-muted mb-4 max-w-md mx-auto">{description}</p>
      )}
      {actionLabel && onAction && (
        <Button onClick={onAction} variant="primary">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
