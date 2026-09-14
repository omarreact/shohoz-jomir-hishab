import React from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: React.ReactNode;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", label, error, helperText, leftIcon, rightIcon, id, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id || generatedId;
    const isInvalid = !!error;

    return (
      <div className={`mb-4 w-full ${className}`}>
        {label && (
          <label htmlFor={inputId} className="mb-1.5 block text-sm font-semibold text-[var(--foreground)]">
            {label}
            {props.required && <span className="ml-1 text-red-500">*</span>}
          </label>
        )}

        <div className="relative">
          {leftIcon && (
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-[var(--muted-foreground)]">
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            className={`flex h-11 w-full rounded-xl border bg-[var(--card-bg)] px-3 py-2 text-sm text-[var(--foreground)] shadow-sm transition-[border-color,box-shadow,background-color] file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-[var(--muted-foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 ${
              isInvalid
                ? "border-red-500 focus-visible:ring-red-500/20"
                : "border-[var(--border-color)] focus-visible:border-[var(--brand-gold)] focus-visible:ring-[color-mix(in_srgb,var(--brand-gold)_22%,transparent)]"
            } ${leftIcon ? "pl-10" : ""} ${rightIcon ? "pr-10" : ""}`}
            aria-invalid={isInvalid}
            aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
            {...props}
          />

          {rightIcon && (
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-[var(--muted-foreground)]">
              {rightIcon}
            </div>
          )}
        </div>

        {error && (
          <div id={`${inputId}-error`} className="mt-1.5 text-sm font-medium text-red-500">
            {error}
          </div>
        )}
        {helperText && !error && (
          <div id={`${inputId}-helper`} className="mt-1.5 text-sm text-[var(--muted-foreground)]">
            {helperText}
          </div>
        )}
      </div>
    );
  },
);
Input.displayName = "Input";
