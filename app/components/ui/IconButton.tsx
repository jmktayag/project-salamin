'use client';

import React from 'react';
import { Button, ButtonProps } from './Button';

export interface IconButtonProps extends Omit<ButtonProps, 'iconOnly'> {
  tooltip?: string;
}

/**
 * Icon-only button component for actions where an icon provides sufficient context
 * Automatically includes accessible labeling and tooltip support
 */
export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ 
    tooltip,
    'aria-label': ariaLabel,
    title,
    children,
    ...props 
  }, ref) => {
    const accessibleLabel = ariaLabel || tooltip || title;
    
    return (
      <Button
        ref={ref}
        iconOnly
        aria-label={accessibleLabel}
        title={tooltip || title}
        {...props}
      >
        {children}
      </Button>
    );
  }
);

IconButton.displayName = 'IconButton';