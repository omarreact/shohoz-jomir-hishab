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
      default: "bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 shadow-sm",
      glass:
        "border border-white/10 shadow-md backdrop-blur-md bg-white/5",
      outline: "border border-slate-200 dark:border-slate-800 bg-transparent",
      flat: "bg-transparent border-0",
    }[variant];

    const hoverClass = hoverEffect
      ? "hover:-translate-y-1 hover:shadow-md hover:border-[#006a4e]/30"
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
    className={`p-4 md:p-6 border-b border-slate-200 dark:border-slate-800 flex flex-col space-y-1.5 ${className}`}
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
    className={`text-xl font-semibold leading-none tracking-tight text-slate-900 dark:text-white ${className}`}
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
    className={`text-sm text-slate-500 dark:text-slate-400 ${className}`}
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
  <div ref={ref} className={`p-4 md:p-6 ${className}`} {...props}>
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
    className={`p-4 md:p-6 border-t border-slate-200 dark:border-slate-800 flex items-center ${className}`}
    {...props}
  >
    {children}
  </div>
));
CardFooter.displayName = "CardFooter";
