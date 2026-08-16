import React from "react";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: React.ReactNode;
  error?: string;
  helperText?: string;
  options: { label: string; value: string | number }[];
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = "", label, error, helperText, options, id, ...props }, ref) => {
    const selectId = id || React.useId();
    const isInvalid = !!error;

    return (
      <div className={`mb-4 w-full ${className}`}>
        {label && (
          <label htmlFor={selectId} className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        
        <select
          ref={ref}
          id={selectId}
          className={`flex h-10 w-full items-center justify-between rounded-md border bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors ${
            isInvalid 
              ? "border-red-500 focus:ring-red-500/20" 
              : "border-slate-200 dark:border-slate-800 focus:border-[#006a4e] focus:ring-[#006a4e]/20"
          }`}
          aria-invalid={isInvalid}
          aria-describedby={error ? `${selectId}-error` : helperText ? `${selectId}-helper` : undefined}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {error && (
          <div id={`${selectId}-error`} className="text-red-500 text-sm font-medium mt-1.5">
            {error}
          </div>
        )}
        {helperText && !error && (
          <div id={`${selectId}-helper`} className="text-slate-500 dark:text-slate-400 text-sm mt-1.5">
            {helperText}
          </div>
        )}
      </div>
    );
  }
);
Select.displayName = "Select";
