import React from "react";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "glass" | "outline" | "flat";
  hoverEffect?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    { className = "", variant = "default", hoverEffect = false, children, style, ...props },
    ref
  ) => {
    const baseClasses =
      "rounded-2xl overflow-hidden relative transition-all duration-300";

    const variantClasses = {
      default: "bg-card text-card-foreground border border-border shadow-md",
      glass:
        "border border-white/10 shadow-md backdrop-blur-md bg-white/5",
      outline: "border border-border bg-transparent",
      flat: "bg-transparent border-0",
    }[variant];

    const hoverClass = hoverEffect
      ? "hover:-translate-y-1 hover:shadow-xl hover:border-[#f6c343]/30"
      : "";

    return (
      <div
        ref={ref}
        className={`${baseClasses} ${variantClasses} ${hoverClass} ${className}`}
        style={style}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Card.displayName = "Card";

export const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className = "", children, ...props }, ref) => (
  <div
    ref={ref}
    className={`p-4 border-b border-border flex flex-col space-y-1.5 ${className}`}
    {...props}
  >
    {children}
  </div>
));
CardHeader.displayName = "CardHeader";

export const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className = "", children, ...props }, ref) => (
  <h3
    ref={ref}
    className={`text-xl font-semibold leading-none tracking-tight ${className}`}
    {...props}
  >
    {children}
  </h3>
));
CardTitle.displayName = "CardTitle";

export const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className = "", children, ...props }, ref) => (
  <p
    ref={ref}
    className={`text-sm text-muted-foreground ${className}`}
    {...props}
  >
    {children}
  </p>
));
CardDescription.displayName = "CardDescription";

export const CardBody = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className = "", children, ...props }, ref) => (
  <div ref={ref} className={`p-4 ${className}`} {...props}>
    {children}
  </div>
));
CardBody.displayName = "CardBody";

// Alias CardContent to CardBody for shadcn compatibility
export const CardContent = CardBody;

export const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className = "", children, ...props }, ref) => (
  <div
    ref={ref}
    className={`p-4 border-t border-border flex items-center ${className}`}
    {...props}
  >
    {children}
  </div>
));
CardFooter.displayName = "CardFooter";
