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
    const inputId = id || React.useId();
    const isInvalid = !!error;

    return (
      <div className={`mb-4 w-full ${className}`}>
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        
        <div className="relative">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              {leftIcon}
            </div>
          )}
          
          <input
            ref={ref}
            id={inputId}
            className={`flex h-10 w-full rounded-md border bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-400 dark:placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors ${
              isInvalid 
                ? "border-red-500 focus-visible:ring-red-500/20" 
                : "border-slate-200 dark:border-slate-800 focus-visible:border-[#006a4e] focus-visible:ring-[#006a4e]/20"
            } ${leftIcon ? "pl-10" : ""} ${rightIcon ? "pr-10" : ""}`}
            aria-invalid={isInvalid}
            aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
            {...props}
          />
          
          {rightIcon && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
              {rightIcon}
            </div>
          )}
        </div>

        {error && (
          <div id={`${inputId}-error`} className="text-red-500 text-sm font-medium mt-1.5">
            {error}
          </div>
        )}
        {helperText && !error && (
          <div id={`${inputId}-helper`} className="text-slate-500 dark:text-slate-400 text-sm mt-1.5">
            {helperText}
          </div>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";
