'use client';

import React from 'react';
import { Button, ButtonProps } from './Button';

export interface SubmitButtonProps extends Omit<ButtonProps, 'type'> {
  form?: string;
  isSubmitting?: boolean;
  submitText?: string;
  submittingText?: string;
}

/**
 * Form submission button with built-in loading and validation states
 * Automatically handles form submission states and provides appropriate feedback
 */
export const SubmitButton = React.forwardRef<HTMLButtonElement, SubmitButtonProps>(
  ({ 
    isSubmitting = false,
    submitText = 'Submit',
    submittingText = 'Submitting...',
    state,
    children,
    disabled,
    ...props 
  }, ref) => {
    const currentState = isSubmitting ? 'loading' : state;
    const isDisabled = disabled || isSubmitting;
    
    const buttonText = children || (isSubmitting ? submittingText : submitText);
    
    return (
      <Button
        ref={ref}
        type="submit"
        state={currentState}
        disabled={isDisabled}
        aria-busy={isSubmitting}
        {...props}
      >
        {buttonText}
      </Button>
    );
  }
);

SubmitButton.displayName = 'SubmitButton';