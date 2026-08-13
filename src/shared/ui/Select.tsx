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
      <div className={`mb-3 ${className}`}>
        {label && (
          <label htmlFor={selectId} className="form-label fw-medium text-body-secondary small mb-1">
            {label}
            {props.required && <span className="text-danger ms-1">*</span>}
          </label>
        )}
        
        <select
          ref={ref}
          id={selectId}
          className={`form-select focus-ring transition-all ${isInvalid ? "is-invalid" : ""}`}
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
          <div id={`${selectId}-error`} className="invalid-feedback d-block mt-1">
            {error}
          </div>
        )}
        {helperText && !error && (
          <div id={`${selectId}-helper`} className="form-text mt-1">
            {helperText}
          </div>
        )}
      </div>
    );
  }
);
Select.displayName = "Select";
