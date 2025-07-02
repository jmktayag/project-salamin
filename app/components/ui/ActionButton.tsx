'use client';

import React from 'react';
import { Button, ButtonProps } from './Button';

export interface ActionButtonProps extends Omit<ButtonProps, 'children' | 'onClick'> {
  action: 'submit' | 'signin' | 'signup' | 'reset' | 'start' | 'next' | 'finish' | 'custom';
  isLoading?: boolean;
  text?: string;
  loadingText?: string;
  onClick?: () => void;
  form?: string; // For form association
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'; // Allow size override
  variant?: 'primary' | 'secondary' | 'accent' | 'outline' | 'ghost' | 'danger' | 'soft' | 'interview'; // Allow variant override
}

/**
 * Unified action button component for consistent styling and behavior
 * Supports both form submissions and custom actions with built-in loading states
 */
export const ActionButton = React.forwardRef<HTMLButtonElement, ActionButtonProps>(
  ({ 
    action,
    isLoading = false,
    text,
    loadingText,
    onClick,
    disabled,
    type,
    form,
    size = 'md',
    variant,
    ...props 
  }, ref) => {
    // Default text based on action type
    const getDefaultText = () => {
      if (isLoading && loadingText) return loadingText;
      
      switch (action) {
        case 'submit':
          return isLoading ? 'Submitting...' : 'Submit Answer';
        case 'signin':
          return isLoading ? 'Signing in...' : 'Sign In';
        case 'signup':
          return isLoading ? 'Creating account...' : 'Create Account';
        case 'reset':
          return isLoading ? 'Sending...' : 'Send Reset Link';
        case 'start':
          return isLoading ? 'Starting...' : 'Start Interview';
        case 'next':
          return 'Next Question';
        case 'finish':
          return isLoading ? 'Analyzing...' : 'Finish Interview';
        case 'custom':
          return text || 'Continue';
        default:
          return 'Continue';
      }
    };

    // Use custom text if provided, otherwise use default
    const buttonText = text || getDefaultText();
    
    // Determine if button should be disabled
    const isDisabled = disabled || isLoading;
    
    // Determine button type - forms use submit, others use button
    const buttonType = type || (action === 'signin' || action === 'signup' || action === 'reset' || action === 'start' ? 'submit' : 'button');
    
    // Default variant based on action - use interview style for interview-related actions
    const defaultVariant = variant || (['submit', 'next', 'finish', 'signin', 'signup', 'reset', 'start'].includes(action) ? 'interview' : 'primary');
    
    // ARIA label for accessibility
    const getAriaLabel = () => {
      switch (action) {
        case 'submit':
          return isLoading ? 'Submitting your answer...' : 'Submit your interview answer';
        case 'signin':
          return isLoading ? 'Signing in to your account...' : 'Sign in to your account';
        case 'signup':
          return isLoading ? 'Creating your account...' : 'Create a new account';
        case 'reset':
          return isLoading ? 'Sending password reset email...' : 'Send password reset email';
        case 'start':
          return isLoading ? 'Starting interview session...' : 'Start interview session';
        case 'next':
          return 'Continue to next interview question';
        case 'finish':
          return isLoading ? 'Analyzing interview responses...' : 'Complete and analyze interview';
        case 'custom':
          return text || buttonText;
        default:
          return buttonText;
      }
    };

    return (
      <Button
        ref={ref}
        type={buttonType}
        variant={defaultVariant}
        size={size}
        state={isLoading ? 'loading' : 'default'}
        disabled={isDisabled}
        onClick={onClick}
        aria-label={getAriaLabel()}
        aria-busy={isLoading}
        form={form}
        {...props}
      >
        {buttonText}
      </Button>
    );
  }
);

ActionButton.displayName = 'ActionButton';