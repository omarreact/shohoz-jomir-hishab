import React from "react";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "primary" | "secondary" | "success" | "danger" | "warning" | "info" | "dark" | "outline";
  size?: "sm" | "md" | "lg";
  pill?: boolean;
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className = "", variant = "primary", size = "md", pill = true, children, ...props }, ref) => {
    let baseClasses = "badge fw-medium d-inline-flex align-items-center justify-content-center transition-all ";
    
    if (pill) baseClasses += "rounded-pill ";
    else baseClasses += "rounded-2 ";

    // Size
    if (size === "sm") baseClasses += "px-2 py-1 text-xs ";
    if (size === "md") baseClasses += "px-3 py-2 text-sm ";
    if (size === "lg") baseClasses += "px-4 py-2 fs-6 ";

    // Variants (Soft transparent by default for premium look)
    if (variant === "primary") baseClasses += "bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 ";
    if (variant === "success") baseClasses += "bg-success bg-opacity-10 text-success border border-success border-opacity-25 ";
    if (variant === "danger") baseClasses += "bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25 ";
    if (variant === "warning") baseClasses += "bg-warning bg-opacity-10 text-warning border border-warning border-opacity-25 ";
    if (variant === "info") baseClasses += "bg-info bg-opacity-10 text-info border border-info border-opacity-25 ";
    if (variant === "dark") baseClasses += "bg-dark bg-opacity-50 text-white border border-secondary border-opacity-50 ";
    if (variant === "secondary") baseClasses += "bg-secondary bg-opacity-10 text-secondary border border-secondary border-opacity-25 ";
    if (variant === "outline") baseClasses += "bg-transparent text-body border border-secondary border-opacity-50 ";

    return (
      <span ref={ref} className={`${baseClasses} ${className}`} {...props}>
        {children}
      </span>
    );
  }
);
Badge.displayName = "Badge";
