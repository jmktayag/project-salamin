'use client';

import React from 'react';
import { cn } from '../../utils/cn';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  variant?: 'default' | 'error' | 'success';
  size?: 'sm' | 'md' | 'lg';
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  error?: boolean;
  helperText?: string;
  label?: string;
  fullWidth?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ 
    className, 
    variant = 'default',
    size = 'md',
    leftIcon,
    rightIcon,
    error = false,
    helperText,
    label,
    fullWidth = false,
    disabled,
    id,
    ...props 
  }, ref) => {
    const generatedId = React.useId();
    const inputId = id || generatedId;
    const helperTextId = helperText ? `${inputId}-helper` : undefined;
    const actualVariant = error ? 'error' : variant;

    const containerClasses = cn(
      'relative',
      fullWidth && 'w-full'
    );

    const inputClasses = cn(
      'gi-input',
      `gi-input-${actualVariant}`,
      `gi-input-${size}`,
      leftIcon && 'gi-input-left-icon',
      rightIcon && 'gi-input-right-icon',
      disabled && 'gi-input-disabled',
      className
    );

    const iconClasses = cn(
      'gi-input-icon',
      disabled && 'gi-input-icon-disabled'
    );

    return (
      <div className={containerClasses}>
        {label && (
          <label 
            htmlFor={inputId}
            className="gi-input-label"
          >
            {label}
          </label>
        )}
        
        <div className="relative">
          {leftIcon && (
            <div className={cn(iconClasses, 'gi-input-icon-left')}>
              {leftIcon}
            </div>
          )}
          
          <input
            ref={ref}
            id={inputId}
            className={inputClasses}
            disabled={disabled}
            aria-describedby={helperTextId}
            aria-invalid={error}
            {...props}
          />
          
          {rightIcon && (
            <div className={cn(iconClasses, 'gi-input-icon-right')}>
              {rightIcon}
            </div>
          )}
        </div>
        
        {helperText && (
          <p 
            id={helperTextId}
            className={cn(
              'gi-input-helper',
              error && 'gi-input-helper-error'
            )}
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input };