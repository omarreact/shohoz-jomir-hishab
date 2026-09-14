import React from "react";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "primary" | "secondary" | "success" | "danger" | "warning" | "info" | "dark" | "outline";
  size?: "sm" | "md" | "lg";
  pill?: boolean;
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className = "", variant = "primary", size = "md", pill = true, children, ...props }, ref) => {
    let baseClasses = "inline-flex items-center justify-center font-medium transition-all ";

    if (pill) baseClasses += "rounded-full ";
    else baseClasses += "rounded-md ";

    if (size === "sm") baseClasses += "px-2 py-0.5 text-xs ";
    if (size === "md") baseClasses += "px-2.5 py-1 text-sm ";
    if (size === "lg") baseClasses += "px-3 py-1.5 text-base ";

    if (variant === "primary") baseClasses += "bg-[var(--brand-gold-soft)] text-[#9a6700] dark:text-[#f7d36f] border border-[color-mix(in_srgb,var(--brand-gold)_24%,transparent)] ";
    if (variant === "success") baseClasses += "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 ";
    if (variant === "danger") baseClasses += "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 ";
    if (variant === "warning") baseClasses += "bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 ";
    if (variant === "info") baseClasses += "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 ";
    if (variant === "dark") baseClasses += "bg-[var(--foreground)] text-[var(--card-bg)] border border-[var(--foreground)] ";
    if (variant === "secondary") baseClasses += "bg-[var(--muted)] text-[var(--foreground)] border border-[var(--border-color)] ";
    if (variant === "outline") baseClasses += "bg-transparent text-[var(--foreground)] border border-[var(--border-color)] ";

    return (
      <span ref={ref} className={`${baseClasses} ${className}`} {...props}>
        {children}
      </span>
    );
  },
);
Badge.displayName = "Badge";
