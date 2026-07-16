import React from "react";
import { Loader2 } from "lucide-react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger" | "dark";
  size?: "sm" | "md" | "lg" | "icon";
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  isFloating?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className = "",
      variant = "primary",
      size = "md",
      isLoading = false,
      leftIcon,
      rightIcon,
      isFloating = false,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    // Base classes
    let baseClasses = "btn d-inline-flex align-items-center justify-content-center transition-all";
    
    // Size classes
    if (size === "sm") baseClasses += " btn-sm px-3 py-1";
    if (size === "md") baseClasses += " px-4 py-2";
    if (size === "lg") baseClasses += " btn-lg px-5 py-3";
    if (size === "icon") baseClasses += " p-2 rounded-circle";

    // Variant classes
    if (variant === "primary") baseClasses += " btn-primary border-0 shadow-md hover-lift focus-ring";
    if (variant === "secondary") baseClasses += " btn-light border shadow-sm hover-lift focus-ring";
    if (variant === "outline") baseClasses += " btn-outline-secondary border-2 bg-transparent hover-lift focus-ring";
    if (variant === "ghost") baseClasses += " bg-transparent border-0 text-body hover-transform focus-ring";
    if (variant === "danger") baseClasses += " btn-danger border-0 text-white shadow-sm hover-lift focus-ring";
    if (variant === "dark") baseClasses += " btn-dark border-0 text-white shadow-sm hover-lift focus-ring";

    // Floating UI
    if (isFloating) {
      baseClasses += " position-absolute rounded-circle shadow-lg";
      if (size !== "icon") baseClasses += " p-3";
    }

    // Disabled / Loading
    if (disabled || isLoading) {
      baseClasses += " opacity-75 pe-none";
    }

    return (
      <button
        ref={ref}
        className={`${baseClasses} ${className}`}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && <Loader2 className="spinner-border spinner-border-sm me-2" size={16} />}
        {!isLoading && leftIcon && <span className={children ? "me-2" : ""}>{leftIcon}</span>}
        {children}
        {!isLoading && rightIcon && <span className={children ? "ms-2" : ""}>{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = "Button";
