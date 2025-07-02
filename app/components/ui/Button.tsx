'use client';

import React from 'react';
import { cn } from '../../utils/cn';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'outline' | 'ghost' | 'danger';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  state?: 'default' | 'loading' | 'success' | 'error';
  loading?: boolean; // Deprecated: use state="loading" instead
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  floating?: boolean;
  iconOnly?: boolean;
  children?: React.ReactNode;
  'aria-label'?: string;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant = 'primary', 
    size = 'md', 
    state = 'default',
    loading = false, // Backward compatibility
    icon,
    iconPosition = 'left',
    fullWidth = false,
    floating = false,
    iconOnly = false,
    disabled,
    children, 
    'aria-label': ariaLabel,
    ...props 
  }, ref) => {
    // Handle backward compatibility for loading prop
    const currentState = loading ? 'loading' : state;
    const isLoading = currentState === 'loading';
    const isDisabled = disabled || isLoading;

    // Generate loading spinner
    const LoadingSpinner = () => (
      <svg 
        className={cn(
          "animate-spin", 
          iconOnly ? "h-4 w-4" : "h-4 w-4 mr-2",
          iconPosition === 'right' && !iconOnly && "ml-2 mr-0"
        )}
        xmlns="http://www.w3.org/2000/svg" 
        fill="none" 
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <circle 
          className="opacity-25" 
          cx="12" 
          cy="12" 
          r="10" 
          stroke="currentColor" 
          strokeWidth="4"
        />
        <path 
          className="opacity-75" 
          fill="currentColor" 
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    );

    // Success checkmark icon
    const SuccessIcon = () => (
      <svg 
        className={cn(
          "h-4 w-4",
          !iconOnly && "mr-2",
          iconPosition === 'right' && !iconOnly && "ml-2 mr-0"
        )}
        xmlns="http://www.w3.org/2000/svg" 
        fill="none" 
        viewBox="0 0 24 24" 
        stroke="currentColor"
        aria-hidden="true"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    );

    // Error X icon
    const ErrorIcon = () => (
      <svg 
        className={cn(
          "h-4 w-4",
          !iconOnly && "mr-2",
          iconPosition === 'right' && !iconOnly && "ml-2 mr-0"
        )}
        xmlns="http://www.w3.org/2000/svg" 
        fill="none" 
        viewBox="0 0 24 24" 
        stroke="currentColor"
        aria-hidden="true"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    );

    // Render appropriate icon based on state
    const renderStateIcon = () => {
      switch (currentState) {
        case 'loading':
          return <LoadingSpinner />;
        case 'success':
          return <SuccessIcon />;
        case 'error':
          return <ErrorIcon />;
        default:
          return null;
      }
    };

    // Render custom icon
    const renderCustomIcon = () => {
      if (!icon || currentState !== 'default') return null;
      
      return (
        <span 
          className={cn(
            "inline-flex items-center",
            !iconOnly && iconPosition === 'left' && "mr-2",
            !iconOnly && iconPosition === 'right' && "ml-2"
          )}
          aria-hidden="true"
        >
          {icon}
        </span>
      );
    };

    // Generate accessible label
    const getAccessibleLabel = () => {
      if (ariaLabel) return ariaLabel;
      if (iconOnly && typeof children === 'string') return children;
      return undefined;
    };

    return (
      <button
        className={cn(
          'gi-btn',
          `gi-btn-${variant}`,
          `gi-btn-${size}`,
          // State-specific styling
          currentState === 'success' && 'gi-btn-success',
          currentState === 'error' && 'gi-btn-error',
          // Layout modifiers
          fullWidth && 'w-full',
          floating && 'gi-btn-floating',
          iconOnly && 'gi-btn-icon-only',
          // Focus and accessibility
          'focus:outline-none focus:ring-2 focus:ring-offset-2',
          variant === 'primary' && 'focus:ring-teal-500',
          variant === 'secondary' && 'focus:ring-blue-500',
          variant === 'accent' && 'focus:ring-amber-500',
          variant === 'danger' && 'focus:ring-red-500',
          className
        )}
        ref={ref}
        disabled={isDisabled}
        aria-label={getAccessibleLabel()}
        aria-busy={isLoading}
        {...props}
      >
        {/* Left-positioned icons */}
        {iconPosition === 'left' && (renderStateIcon() || renderCustomIcon())}
        
        {/* Button content */}
        {!iconOnly && children}
        
        {/* Right-positioned icons */}
        {iconPosition === 'right' && (renderStateIcon() || renderCustomIcon())}
        
        {/* Icon-only content (for accessibility) */}
        {iconOnly && (
          <span className="sr-only">
            {children}
          </span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button };