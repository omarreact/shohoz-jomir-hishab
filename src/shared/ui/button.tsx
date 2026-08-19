import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/src/shared/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-black/20 dark:focus-visible:ring-white/20",
  {
    variants: {
      variant: {
        default: "bg-neutral-900 text-white shadow-sm hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200",
        primary: "bg-neutral-900 text-white shadow-sm hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200",
        dark: "bg-neutral-900 text-white shadow-sm hover:bg-neutral-800 dark:bg-neutral-800 dark:hover:bg-neutral-700",
        destructive: "bg-red-600 text-white shadow-sm hover:bg-red-700",
        outline: "border border-[var(--border-color)] bg-[var(--card-bg)] text-[var(--foreground)] shadow-sm hover:bg-[var(--secondary)]",
        secondary: "bg-[var(--secondary)] text-[var(--foreground)] hover:bg-[var(--accent)]",
        ghost: "hover:bg-[var(--secondary)] hover:text-[var(--foreground)]",
        link: "text-[var(--foreground)] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2.5 has-[>svg]:px-3",
        sm: "h-9 rounded-lg gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-11 rounded-xl px-6 has-[>svg]:px-4",
        icon: "size-10",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> { asChild?: boolean; }

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
});
Button.displayName = "Button";

export { Button, buttonVariants };
