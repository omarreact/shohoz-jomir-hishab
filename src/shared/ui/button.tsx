import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/src/shared/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          "bg-[#006a4e] text-white shadow-xs hover:bg-[#00523b]",
        primary:
          "bg-[#006a4e] text-white shadow-xs hover:bg-[#00523b]",
        dark: "bg-slate-900 text-white shadow-xs hover:bg-slate-800 dark:bg-slate-950 dark:hover:bg-slate-900",
        destructive:
          "bg-red-500 text-white shadow-xs hover:bg-red-600 focus-visible:ring-red-500/20 dark:focus-visible:ring-red-500/40",
        outline:
          "border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white",
        secondary:
          "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs hover:bg-slate-200 dark:hover:bg-slate-700",
        ghost:
          "hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white",
        link: "text-[#006a4e] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
