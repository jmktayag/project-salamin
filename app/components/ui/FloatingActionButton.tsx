'use client';

import React from 'react';
import { Button, ButtonProps } from './Button';
import { cn } from '../../utils/cn';

export interface FloatingActionButtonProps extends Omit<ButtonProps, 'floating' | 'iconOnly'> {
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  offset?: 'sm' | 'md' | 'lg';
}

/**
 * Floating Action Button component that provides a fixed-position circular button
 * Ideal for primary actions that should be accessible from anywhere on the page
 */
export const FloatingActionButton = React.forwardRef<HTMLButtonElement, FloatingActionButtonProps>(
  ({ 
    className, 
    position = 'bottom-right',
    offset = 'md',
    size = 'lg',
    variant = 'primary',
    children,
    ...props 
  }, ref) => {
    const offsetClasses = {
      'sm': {
        'bottom-right': 'bottom-4 right-4',
        'bottom-left': 'bottom-4 left-4',
        'top-right': 'top-4 right-4', 
        'top-left': 'top-4 left-4'
      },
      'md': {
        'bottom-right': 'bottom-6 right-6',
        'bottom-left': 'bottom-6 left-6',
        'top-right': 'top-6 right-6',
        'top-left': 'top-6 left-6'
      },
      'lg': {
        'bottom-right': 'bottom-8 right-8',
        'bottom-left': 'bottom-8 left-8',
        'top-right': 'top-8 right-8',
        'top-left': 'top-8 left-8'
      }
    };

    return (
      <Button
        ref={ref}
        className={cn(
          offsetClasses[offset][position],
          className
        )}
        floating
        iconOnly
        size={size}
        variant={variant}
        {...props}
      >
        {children}
      </Button>
    );
  }
);

FloatingActionButton.displayName = 'FloatingActionButton';