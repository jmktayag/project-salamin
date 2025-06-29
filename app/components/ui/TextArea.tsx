'use client';

import React, { useRef, useEffect, useImperativeHandle } from 'react';
import { cn } from '../../utils/cn';

export interface TextAreaProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'> {
  variant?: 'default' | 'error' | 'success';
  size?: 'sm' | 'md' | 'lg';
  error?: boolean;
  helperText?: string;
  label?: string;
  fullWidth?: boolean;
  autoResize?: boolean;
  minRows?: number;
  maxRows?: number;
  rightAction?: React.ReactNode;
}

export interface TextAreaRef extends HTMLTextAreaElement {
  focus: () => void;
  blur: () => void;
  select: () => void;
  setSelectionRange: (start: number, end: number, direction?: 'forward' | 'backward' | 'none') => void;
}

const TextArea = React.forwardRef<TextAreaRef, TextAreaProps>(
  ({ 
    className, 
    variant = 'default',
    size = 'md',
    error = false,
    helperText,
    label,
    fullWidth = false,
    autoResize = false,
    minRows = 3,
    maxRows = 8,
    rightAction,
    disabled,
    id,
    onChange,
    value,
    ...props 
  }, ref) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const generatedId = React.useId();
    const inputId = id || generatedId;
    const helperTextId = helperText ? `${inputId}-helper` : undefined;
    const actualVariant = error ? 'error' : variant;

    // Auto-resize functionality
    const adjustHeight = React.useCallback(() => {
      const textarea = textareaRef.current;
      if (!textarea || !autoResize) return;

      // Reset height to auto to get the correct scrollHeight
      textarea.style.height = 'auto';
      
      // Calculate the height based on content
      const lineHeight = parseInt(getComputedStyle(textarea).lineHeight, 10);
      const minHeight = lineHeight * minRows;
      const maxHeight = lineHeight * maxRows;
      
      let newHeight = Math.max(textarea.scrollHeight, minHeight);
      if (maxHeight > 0) {
        newHeight = Math.min(newHeight, maxHeight);
      }
      
      textarea.style.height = `${newHeight}px`;
    }, [autoResize, minRows, maxRows]);

    // Adjust height on value changes
    useEffect(() => {
      adjustHeight();
    }, [value, adjustHeight]);

    // Expose methods through ref
    useImperativeHandle(ref, () => ({
      ...textareaRef.current!,
      focus: () => textareaRef.current?.focus(),
      blur: () => textareaRef.current?.blur(),
      select: () => textareaRef.current?.select(),
      setSelectionRange: (start: number, end: number, direction?: 'forward' | 'backward' | 'none') => 
        textareaRef.current?.setSelectionRange(start, end, direction),
    }), []);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onChange?.(e);
      if (autoResize) {
        // Use setTimeout to ensure the value is updated before adjusting height
        setTimeout(adjustHeight, 0);
      }
    };

    const containerClasses = cn(
      'relative',
      fullWidth && 'w-full'
    );

    const textareaClasses = cn(
      'gi-textarea',
      `gi-textarea-${actualVariant}`,
      `gi-textarea-${size}`,
      autoResize && 'gi-textarea-auto-resize',
      disabled && 'gi-textarea-disabled',
      rightAction && 'gi-textarea-with-action',
      className
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
          <textarea
            ref={textareaRef}
            id={inputId}
            className={textareaClasses}
            disabled={disabled}
            aria-describedby={helperTextId}
            aria-invalid={error}
            value={value}
            onChange={handleChange}
            rows={autoResize ? minRows : props.rows}
            style={autoResize ? { resize: 'none', overflow: 'hidden' } : undefined}
            {...props}
          />
          
          {rightAction && (
            <div className="gi-textarea-action">
              {rightAction}
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

TextArea.displayName = 'TextArea';

export { TextArea };