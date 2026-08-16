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

    // Size
    if (size === "sm") baseClasses += "px-2 py-0.5 text-xs ";
    if (size === "md") baseClasses += "px-2.5 py-1 text-sm ";
    if (size === "lg") baseClasses += "px-3 py-1.5 text-base ";

    // Variants (Soft transparent by default for premium look)
    if (variant === "primary") baseClasses += "bg-[#006a4e]/10 text-[#006a4e] border border-[#006a4e]/20 ";
    if (variant === "success") baseClasses += "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 ";
    if (variant === "danger") baseClasses += "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 ";
    if (variant === "warning") baseClasses += "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 ";
    if (variant === "info") baseClasses += "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 ";
    if (variant === "dark") baseClasses += "bg-slate-800 text-white border border-slate-700 ";
    if (variant === "secondary") baseClasses += "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 ";
    if (variant === "outline") baseClasses += "bg-transparent text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600 ";

    return (
      <span ref={ref} className={`${baseClasses} ${className}`} {...props}>
        {children}
      </span>
    );
  }
);
Badge.displayName = "Badge";
