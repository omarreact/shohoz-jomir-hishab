import React from "react";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "primary" | "secondary" | "success" | "danger" | "warning" | "info" | "dark" | "outline";
  size?: "sm" | "md" | "lg";
  pill?: boolean;
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className = "", variant = "primary", size = "md", pill = true, children, ...props }, ref) => {
    let baseClasses = "inline-flex items-center justify-center font-semibold transition-colors ";

    baseClasses += pill ? "rounded-full " : "rounded-lg ";
    if (size === "sm") baseClasses += "px-2 py-0.5 text-[10px] sm:text-xs ";
    if (size === "md") baseClasses += "px-2.5 py-1 text-xs sm:text-sm ";
    if (size === "lg") baseClasses += "px-3 py-1.5 text-sm sm:text-base ";

    if (variant === "primary") baseClasses += "bg-[var(--brand-gold-soft)] text-[var(--brand-gold-text)] border border-[color-mix(in_srgb,var(--brand-gold)_24%,transparent)] ";
    if (variant === "success") baseClasses += "bg-emerald-50 text-emerald-700 border border-emerald-100 ";
    if (variant === "danger") baseClasses += "bg-red-50 text-red-700 border border-red-100 ";
    if (variant === "warning") baseClasses += "bg-amber-50 text-amber-700 border border-amber-100 ";
    if (variant === "info") baseClasses += "bg-blue-50 text-blue-700 border border-blue-100 ";
    if (variant === "dark") baseClasses += "bg-[var(--foreground)] text-white border border-[var(--foreground)] ";
    if (variant === "secondary") baseClasses += "bg-[var(--muted)] text-[var(--foreground)] border border-[var(--border-color)] ";
    if (variant === "outline") baseClasses += "bg-white text-[var(--foreground)] border border-[var(--border-color)] ";

    return (
      <span ref={ref} className={`${baseClasses}${className}`} {...props}>
        {children}
      </span>
    );
  },
);
Badge.displayName = "Badge";
