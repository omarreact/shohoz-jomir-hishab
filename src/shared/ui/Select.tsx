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
        {label && (
          <label htmlFor={selectId} className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
            {label}
            {props.required && <span className="ml-1 text-red-500">*</span>}
          </label>
        )}
        <div className="relative">
          <select
            {...props}
            ref={ref}
            id={selectId}
            className={`flex h-10 w-full items-center justify-between rounded-md border bg-white px-3 py-2 text-sm text-slate-900 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 dark:bg-slate-900 dark:text-white ${loading ? "pr-10" : ""} ${isInvalid ? "border-red-500 focus:ring-red-500/20" : "border-slate-200 focus:border-[#006a4e] focus:ring-[#006a4e]/20 dark:border-slate-800"}`}
            aria-invalid={isInvalid}
            aria-busy={loading}
            aria-describedby={error ? `${selectId}-error` : helperText ? `${selectId}-helper` : undefined}
            disabled={loading || props.disabled}
          >
            {visibleOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          {loading && (
            <Loader2 aria-hidden="true" className="pointer-events-none absolute right-9 top-1/2 -translate-y-1/2 animate-spin text-[#006a4e] dark:text-emerald-300" size={17} />
          )}
        </div>
        {error && <div id={`${selectId}-error`} className="mt-1.5 text-sm font-medium text-red-500">{error}</div>}
        {helperText && !error && <div id={`${selectId}-helper`} className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">{helperText}</div>}
      </div>
    );
  },
);
Select.displayName = "Select";
