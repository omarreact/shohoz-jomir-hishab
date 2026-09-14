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
        {label ? (
          <label htmlFor={inputId} className="mb-1.5 block text-sm font-bold text-[var(--foreground)]">
            {label}
            {props.required ? <span className="ml-1 text-red-500">*</span> : null}
          </label>
        ) : null}

        <div className="relative">
          {leftIcon ? (
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[var(--muted-foreground)]">
              {leftIcon}
            </div>
          ) : null}

          <input
            ref={ref}
            id={inputId}
            className={`flex h-12 w-full rounded-xl border bg-white px-3.5 py-2.5 text-base text-[var(--foreground)] shadow-[var(--shadow-xs)] transition-[border-color,box-shadow,background-color] file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-[#969ca6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500 disabled:opacity-70 sm:text-sm ${
              isInvalid
                ? "border-red-400 focus-visible:ring-red-500/20"
                : "border-[var(--border-color)] focus-visible:border-[var(--brand-gold)] focus-visible:ring-[color-mix(in_srgb,var(--brand-gold)_22%,transparent)]"
            } ${leftIcon ? "pl-10" : ""} ${rightIcon ? "pr-10" : ""}`}
            aria-invalid={isInvalid}
            aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
            {...props}
          />

          {rightIcon ? (
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 text-[var(--muted-foreground)]">
              {rightIcon}
            </div>
          ) : null}
        </div>

        {error ? (
          <div id={`${inputId}-error`} className="mt-1.5 text-xs font-semibold text-red-600 sm:text-sm">
            {error}
          </div>
        ) : null}
        {helperText && !error ? (
          <div id={`${inputId}-helper`} className="mt-1.5 text-xs leading-5 text-[var(--muted-foreground)] sm:text-sm">
            {helperText}
          </div>
        ) : null}
      </div>
    );
  },
);
Input.displayName = "Input";
