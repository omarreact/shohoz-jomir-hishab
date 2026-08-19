import React from "react";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "glass" | "outline" | "flat";
  hoverEffect?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(({ className = "", variant = "default", hoverEffect = false, children, style, ...props }, ref) => {
  const variants = {
    default: "bg-[var(--card-bg)] text-[var(--foreground)] border border-[var(--border-color)] shadow-sm",
    glass: "bg-[color-mix(in_srgb,var(--card-bg)_82%,transparent)] text-[var(--foreground)] border border-[var(--border-color)] shadow-md backdrop-blur-xl",
    outline: "bg-transparent text-[var(--foreground)] border border-[var(--border-color)]",
    flat: "bg-transparent border-0 text-[var(--foreground)]",
  };
  return <div ref={ref} className={`relative overflow-hidden rounded-2xl transition-all duration-200 ${variants[variant]} ${hoverEffect ? "hover:-translate-y-0.5 hover:shadow-md" : ""} ${className}`} style={style} {...props}>{children}</div>;
});
Card.displayName = "Card";

export const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className = "", children, ...props }, ref) => (
  <div ref={ref} className={`flex flex-col space-y-1.5 border-b border-[var(--border-color)] p-5 md:p-6 ${className}`} {...props}>{children}</div>
));
CardHeader.displayName = "CardHeader";

export const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(({ className = "", children, ...props }, ref) => (
  <h3 ref={ref} className={`text-lg font-semibold leading-tight tracking-tight text-[var(--foreground)] ${className}`} {...props}>{children}</h3>
));
CardTitle.displayName = "CardTitle";

export const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(({ className = "", children, ...props }, ref) => (
  <p ref={ref} className={`text-sm leading-6 text-[var(--muted-foreground)] ${className}`} {...props}>{children}</p>
));
CardDescription.displayName = "CardDescription";

export const CardBody = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className = "", children, ...props }, ref) => (
  <div ref={ref} className={`p-5 md:p-6 ${className}`} {...props}>{children}</div>
));
CardBody.displayName = "CardBody";

export const CardContent = CardBody;

export const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className = "", children, ...props }, ref) => (
  <div ref={ref} className={`flex items-center border-t border-[var(--border-color)] p-5 md:p-6 ${className}`} {...props}>{children}</div>
));
CardFooter.displayName = "CardFooter";
