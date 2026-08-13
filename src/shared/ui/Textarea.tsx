import React from "react";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: React.ReactNode;
  error?: string;
  helperText?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className = "", label, error, helperText, id, ...props }, ref) => {
    const textareaId = id || React.useId();
    const isInvalid = !!error;

    return (
      <div className={`mb-3 ${className}`}>
        {label && (
          <label htmlFor={textareaId} className="form-label fw-medium text-body-secondary small mb-1">
            {label}
            {props.required && <span className="text-danger ms-1">*</span>}
          </label>
        )}
        
        <textarea
          ref={ref}
          id={textareaId}
          className={`form-control focus-ring transition-all ${isInvalid ? "is-invalid" : ""}`}
          aria-invalid={isInvalid}
          aria-describedby={error ? `${textareaId}-error` : helperText ? `${textareaId}-helper` : undefined}
          {...props}
        />

        {error && (
          <div id={`${textareaId}-error`} className="invalid-feedback d-block mt-1">
            {error}
          </div>
        )}
        {helperText && !error && (
          <div id={`${textareaId}-helper`} className="form-text mt-1">
            {helperText}
          </div>
        )}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";
