import React from "react";
import { Loader2 } from "lucide-react";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: React.ReactNode;
  error?: string;
  helperText?: string;
  options: { label: string; value: string | number }[];
  loading?: boolean;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = "", label, error, helperText, options, id, loading = false, ...props }, ref) => {
    const generatedId = React.useId();
    const selectId = id || generatedId;
    const isInvalid = !!error;
    const visibleOptions = loading ? [{ value: "", label: "লোড হচ্ছে…" }] : options;

    return (
      <div className={`mb-4 w-full ${className}`}>
        {label ? (
          <label htmlFor={selectId} className="mb-1.5 block text-sm font-bold text-[var(--foreground)]">
            {label}
            {props.required ? <span className="ml-1 text-red-500">*</span> : null}
          </label>
        ) : null}
        <div className="relative">
          <select
            {...props}
            ref={ref}
            id={selectId}
            className={`flex h-12 w-full items-center justify-between rounded-xl border bg-white px-3.5 py-2.5 text-base text-[var(--foreground)] shadow-[var(--shadow-xs)] transition-[border-color,box-shadow,background-color] focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500 disabled:opacity-70 sm:text-sm ${loading ? "pr-10" : ""} ${
              isInvalid
                ? "border-red-400 focus:ring-red-500/20"
                : "border-[var(--border-color)] focus:border-[var(--brand-gold)] focus:ring-[color-mix(in_srgb,var(--brand-gold)_22%,transparent)]"
            }`}
            aria-invalid={isInvalid}
            aria-busy={loading}
            aria-describedby={error ? `${selectId}-error` : helperText ? `${selectId}-helper` : undefined}
            disabled={loading || props.disabled}
          >
            {visibleOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          {loading ? (
            <Loader2 aria-hidden="true" className="pointer-events-none absolute right-9 top-1/2 -translate-y-1/2 animate-spin text-[var(--brand-gold-text)]" size={17} />
          ) : null}
        </div>
        {error ? <div id={`${selectId}-error`} className="mt-1.5 text-xs font-semibold text-red-600 sm:text-sm">{error}</div> : null}
        {helperText && !error ? <div id={`${selectId}-helper`} className="mt-1.5 text-xs leading-5 text-[var(--muted-foreground)] sm:text-sm">{helperText}</div> : null}
      </div>
    );
  },
);
Select.displayName = "Select";
