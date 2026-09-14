import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/src/shared/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--brand-gold)_30%,transparent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]",
  {
    variants: {
      variant: {
        default: "border border-[color-mix(in_srgb,var(--brand-gold-strong)_70%,transparent)] bg-[var(--primary)] text-[var(--primary-foreground)] shadow-[0_8px_20px_rgba(222,164,20,0.18)] hover:-translate-y-px hover:bg-[var(--brand-gold-strong)] hover:shadow-[0_10px_24px_rgba(222,164,20,0.24)]",
        primary: "border border-[color-mix(in_srgb,var(--brand-gold-strong)_70%,transparent)] bg-[var(--primary)] text-[var(--primary-foreground)] shadow-[0_8px_20px_rgba(222,164,20,0.18)] hover:-translate-y-px hover:bg-[var(--brand-gold-strong)] hover:shadow-[0_10px_24px_rgba(222,164,20,0.24)]",
        dark: "bg-[var(--foreground)] text-[var(--card-bg)] shadow-sm hover:opacity-90",
        destructive: "bg-red-600 text-white shadow-sm hover:bg-red-700",
        outline: "border border-[var(--border-color)] bg-[var(--card-bg)] text-[var(--foreground)] shadow-sm hover:border-[color-mix(in_srgb,var(--brand-gold)_45%,var(--border-color))] hover:bg-[var(--brand-gold-faint)]",
        secondary: "border border-[color-mix(in_srgb,var(--brand-gold)_18%,var(--border-color))] bg-[var(--secondary)] text-[var(--foreground)] hover:bg-[var(--brand-gold-soft)]",
        ghost: "text-[var(--foreground)] hover:bg-[var(--secondary)]",
        link: "text-[#9a6700] underline-offset-4 hover:underline dark:text-[#f7d36f]",
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
