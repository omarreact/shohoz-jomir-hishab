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
          <label htmlFor={textareaId} className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        
        <textarea
          ref={ref}
          id={textareaId}
          className={`flex min-h-[80px] w-full rounded-md border bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors ${
            isInvalid 
              ? "border-red-500 focus-visible:ring-red-500/20" 
              : "border-slate-200 dark:border-slate-800 focus-visible:border-[#006a4e] focus-visible:ring-[#006a4e]/20"
          }`}
          aria-invalid={isInvalid}
          aria-describedby={error ? `${textareaId}-error` : helperText ? `${textareaId}-helper` : undefined}
          {...props}
        />

        {error && (
          <div id={`${textareaId}-error`} className="text-red-500 text-sm font-medium mt-1.5">
            {error}
          </div>
        )}
        {helperText && !error && (
          <div id={`${textareaId}-helper`} className="text-slate-500 dark:text-slate-400 text-sm mt-1.5">
            {helperText}
          </div>
        )}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";
