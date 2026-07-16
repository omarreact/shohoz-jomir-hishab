import React from "react";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "glass" | "outline" | "flat";
  hoverEffect?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className = "", variant = "default", hoverEffect = false, children, ...props }, ref) => {
    let baseClasses = "rounded-4 overflow-hidden position-relative ";
    
    if (variant === "default") {
      baseClasses += "shadow-md border";
      baseClasses += " bg-body"; // Assuming bg-body maps to var(--card-bg) or similar
    }
    if (variant === "glass") {
      baseClasses += "border shadow-md";
      baseClasses += " bg-glass backdrop-blur"; 
    }
    if (variant === "outline") {
      baseClasses += "border bg-transparent";
    }
    if (variant === "flat") {
      baseClasses += "bg-light border-0"; // subtle background
    }

    if (hoverEffect) {
      baseClasses += " hover-lift";
    }

    return (
      <div ref={ref} className={`${baseClasses} ${className}`} {...props}>
        {children}
      </div>
    );
  }
);
Card.displayName = "Card";

export const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className = "", children, ...props }, ref) => (
    <div ref={ref} className={`p-4 border-bottom ${className}`} {...props}>
      {children}
    </div>
  )
);
CardHeader.displayName = "CardHeader";

export const CardBody = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className = "", children, ...props }, ref) => (
    <div ref={ref} className={`p-4 ${className}`} {...props}>
      {children}
    </div>
  )
);
CardBody.displayName = "CardBody";

export const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className = "", children, ...props }, ref) => (
    <div ref={ref} className={`p-4 border-top ${className}`} style={{ backgroundColor: 'var(--card-bg-secondary)' }} {...props}>
      {children}
    </div>
  )
);
CardFooter.displayName = "CardFooter";
