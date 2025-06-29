'use client';

import React from 'react';
import { AlertCircle } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface FormFieldProps extends React.HTMLAttributes<HTMLDivElement> {
  label?: string;
  labelFor?: string;
  error?: string | boolean;
  helperText?: string;
  required?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  children: React.ReactNode;
}

const FormField = React.forwardRef<HTMLDivElement, FormFieldProps>(
  ({ 
    className,
    label,
    labelFor,
    error,
    helperText,
    required = false,
    disabled = false,
    fullWidth = false,
    children,
    ...props 
  }, ref) => {
    const generatedId = React.useId();
    const fieldId = labelFor || generatedId;
    const errorId = error ? `${fieldId}-error` : undefined;
    const helperTextId = helperText ? `${fieldId}-helper` : undefined;
    const hasError = Boolean(error);
    const errorMessage = typeof error === 'string' ? error : undefined;

    const containerClasses = cn(
      'gi-form-field',
      fullWidth && 'gi-form-field-full-width',
      disabled && 'gi-form-field-disabled',
      hasError && 'gi-form-field-error',
      className
    );

    // Clone children to add form field context
    const childrenWithProps = React.Children.map(children, (child) => {
      if (React.isValidElement(child)) {
        const childProps: Record<string, unknown> = {
          id: fieldId,
          'aria-describedby': [errorId, helperTextId].filter(Boolean).join(' ') || undefined,
          'aria-invalid': hasError,
          disabled: disabled || child.props.disabled,
        };

        // Add error prop for components that accept it
        if ('error' in child.props || hasError) {
          childProps.error = hasError;
        }

        return React.cloneElement(child, childProps);
      }
      return child;
    });

    return (
      <div
        ref={ref}
        className={containerClasses}
        {...props}
      >
        {label && (
          <label 
            htmlFor={fieldId}
            className={cn(
              'gi-form-field-label',
              disabled && 'gi-form-field-label-disabled'
            )}
          >
            {label}
            {required && (
              <span className="gi-form-field-required" aria-label="required">
                *
              </span>
            )}
          </label>
        )}
        
        <div className="gi-form-field-control">
          {childrenWithProps}
        </div>
        
        {(hasError || helperText) && (
          <div className="gi-form-field-messages">
            {hasError && errorMessage && (
              <p 
                id={errorId}
                className="gi-form-field-error-message"
                role="alert"
              >
                <AlertCircle className="gi-form-field-error-icon" />
                {errorMessage}
              </p>
            )}
            
            {helperText && !hasError && (
              <p 
                id={helperTextId}
                className="gi-form-field-helper-text"
              >
                {helperText}
              </p>
            )}
          </div>
        )}
      </div>
    );
  }
);

FormField.displayName = 'FormField';

export { FormField };