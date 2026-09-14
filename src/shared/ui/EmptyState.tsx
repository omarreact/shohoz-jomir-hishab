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
      className={`flex min-h-[15rem] flex-col items-center justify-center rounded-2xl border border-dashed border-[color-mix(in_srgb,var(--brand-gold)_28%,var(--border-color))] bg-[var(--brand-gold-faint)] px-5 py-10 text-center ${className}`}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-[var(--brand-gold-text)] shadow-sm ring-1 ring-[var(--border-color)]">
        {icon || <FolderX size={27} strokeWidth={1.8} />}
      </div>
      <h3 className="mt-4 text-lg font-extrabold text-[var(--foreground)]">{title}</h3>
      {description ? (
        <p className="mt-2 max-w-md text-sm leading-6 text-[var(--muted-foreground)]">
          {description}
        </p>
      ) : null}
      {actionLabel && onAction ? (
        <Button onClick={onAction} variant="primary" className="mt-5">
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}
