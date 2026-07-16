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
      <div className={`mb-3 ${className}`}>
        {label && (
          <label htmlFor={inputId} className="form-label fw-medium text-body-secondary small mb-1">
            {label}
            {props.required && <span className="text-danger ms-1">*</span>}
          </label>
        )}
        
        <div className="position-relative">
          {leftIcon && (
            <div className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted">
              {leftIcon}
            </div>
          )}
          
          <input
            ref={ref}
            id={inputId}
            className={`form-control focus-ring transition-all ${leftIcon ? "ps-5" : ""} ${rightIcon ? "pe-5" : ""} ${isInvalid ? "is-invalid" : ""}`}
            aria-invalid={isInvalid}
            aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
            {...props}
          />
          
          {rightIcon && (
            <div className="position-absolute top-50 end-0 translate-middle-y me-3 text-muted">
              {rightIcon}
            </div>
          )}
        </div>

        {error && (
          <div id={`${inputId}-error`} className="invalid-feedback d-block mt-1">
            {error}
          </div>
        )}
        {helperText && !error && (
          <div id={`${inputId}-helper`} className="form-text mt-1">
            {helperText}
          </div>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";
