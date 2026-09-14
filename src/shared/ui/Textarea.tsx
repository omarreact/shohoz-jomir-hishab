import React from "react";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: React.ReactNode;
  error?: string;
  helperText?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className = "", label, error, helperText, id, ...props }, ref) => {
    const generatedId = React.useId();
    const textareaId = id || generatedId;
    const isInvalid = !!error;

    return (
      <div className={`mb-4 w-full ${className}`}>
        {label && (
          <label htmlFor={textareaId} className="mb-1.5 block text-sm font-semibold text-[var(--foreground)]">
            {label}
            {props.required && <span className="ml-1 text-red-500">*</span>}
          </label>
        )}

        <textarea
          ref={ref}
          id={textareaId}
          className={`flex min-h-[96px] w-full rounded-xl border bg-[var(--card-bg)] px-3 py-2.5 text-sm text-[var(--foreground)] shadow-sm transition-[border-color,box-shadow,background-color] placeholder:text-[var(--muted-foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 ${
            isInvalid
              ? "border-red-500 focus-visible:ring-red-500/20"
              : "border-[var(--border-color)] focus-visible:border-[var(--brand-gold)] focus-visible:ring-[color-mix(in_srgb,var(--brand-gold)_22%,transparent)]"
          }`}
          aria-invalid={isInvalid}
          aria-describedby={error ? `${textareaId}-error` : helperText ? `${textareaId}-helper` : undefined}
          {...props}
        />

        {error && (
          <div id={`${textareaId}-error`} className="mt-1.5 text-sm font-medium text-red-500">
            {error}
          </div>
        )}
        {helperText && !error && (
          <div id={`${textareaId}-helper`} className="mt-1.5 text-sm text-[var(--muted-foreground)]">
            {helperText}
          </div>
        )}
      </div>
    );
  },
);
Textarea.displayName = "Textarea";
