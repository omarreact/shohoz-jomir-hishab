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
        {label ? (
          <label htmlFor={textareaId} className="mb-1.5 block text-sm font-bold text-[var(--foreground)]">
            {label}
            {props.required ? <span className="ml-1 text-red-500">*</span> : null}
          </label>
        ) : null}

        <textarea
          ref={ref}
          id={textareaId}
          className={`flex min-h-[112px] w-full resize-y rounded-xl border bg-white px-3.5 py-3 text-base leading-6 text-[var(--foreground)] shadow-[var(--shadow-xs)] transition-[border-color,box-shadow,background-color] placeholder:text-[#969ca6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500 disabled:opacity-70 sm:text-sm ${
            isInvalid
              ? "border-red-400 focus-visible:ring-red-500/20"
              : "border-[var(--border-color)] focus-visible:border-[var(--brand-gold)] focus-visible:ring-[color-mix(in_srgb,var(--brand-gold)_22%,transparent)]"
          }`}
          aria-invalid={isInvalid}
          aria-describedby={error ? `${textareaId}-error` : helperText ? `${textareaId}-helper` : undefined}
          {...props}
        />

        {error ? (
          <div id={`${textareaId}-error`} className="mt-1.5 text-xs font-semibold text-red-600 sm:text-sm">
            {error}
          </div>
        ) : null}
        {helperText && !error ? (
          <div id={`${textareaId}-helper`} className="mt-1.5 text-xs leading-5 text-[var(--muted-foreground)] sm:text-sm">
            {helperText}
          </div>
        ) : null}
      </div>
    );
  },
);
Textarea.displayName = "Textarea";
