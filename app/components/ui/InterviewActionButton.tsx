'use client';

import React from 'react';
import { Button, ButtonProps } from './Button';

export interface InterviewActionButtonProps extends Omit<ButtonProps, 'children' | 'onClick'> {
  action: 'submit' | 'next' | 'finish';
  isLoading?: boolean;
  onClick: () => void;
  customText?: string;
  customLoadingText?: string;
}

/**
 * Specialized button component for interview flow actions
 * Provides consistent styling and behavior for Submit Answer, Next Question, and Finish Interview buttons
 */
export const InterviewActionButton = React.forwardRef<HTMLButtonElement, InterviewActionButtonProps>(
  ({ 
    action,
    isLoading = false,
    onClick,
    customText,
    customLoadingText,
    disabled,
    ...props 
  }, ref) => {
    // Default text based on action type
    const getDefaultText = () => {
      switch (action) {
        case 'submit':
          return isLoading ? 'Submitting...' : 'Submit Answer';
        case 'next':
          return 'Next Question';
        case 'finish':
          return isLoading ? 'Analyzing...' : 'Finish Interview';
        default:
          return 'Continue';
      }
    };

    // Use custom text if provided, otherwise use default
    const buttonText = customText || (isLoading && customLoadingText) || getDefaultText();
    
    // Determine if button should be disabled
    const isDisabled = disabled || isLoading;
    
    // ARIA label for accessibility
    const getAriaLabel = () => {
      switch (action) {
        case 'submit':
          return isLoading ? 'Submitting your answer...' : 'Submit your interview answer';
        case 'next':
          return 'Continue to next interview question';
        case 'finish':
          return isLoading ? 'Analyzing interview responses...' : 'Complete and analyze interview';
        default:
          return buttonText;
      }
    };

    return (
      <Button
        ref={ref}
        type="button"
        variant="primary"
        size="lg"
        state={isLoading ? 'loading' : 'default'}
        disabled={isDisabled}
        onClick={onClick}
        aria-label={getAriaLabel()}
        aria-busy={isLoading}
        className="inline-flex items-center justify-center px-6 py-3 focus:ring-2 focus:ring-teal-500 focus:outline-none"
        {...props}
      >
        {buttonText}
      </Button>
    );
  }
);

InterviewActionButton.displayName = 'InterviewActionButton';