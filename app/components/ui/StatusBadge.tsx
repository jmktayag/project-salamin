'use client';

import React from 'react';
import { CheckCircle2, XCircle, PlayCircle, AlertCircle, Clock, HelpCircle } from 'lucide-react';
import { cn } from '../../utils/cn';

export type StatusVariant = 
  | 'success' 
  | 'error' 
  | 'warning' 
  | 'info' 
  | 'completed' 
  | 'abandoned' 
  | 'in_progress'
  | 'pending'
  | 'technical'
  | 'behavioral'
  | 'mixed';

export interface StatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant: StatusVariant;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  children?: React.ReactNode;
}

const StatusBadge = React.forwardRef<HTMLSpanElement, StatusBadgeProps>(
  ({ 
    className, 
    variant,
    size = 'md',
    showIcon = true,
    children,
    ...props 
  }, ref) => {
    
    const getIcon = (variant: StatusVariant) => {
      switch (variant) {
        case 'success':
        case 'completed':
          return <CheckCircle2 className="gi-badge-icon" />;
        case 'error':
        case 'abandoned':
          return <XCircle className="gi-badge-icon" />;
        case 'warning':
          return <AlertCircle className="gi-badge-icon" />;
        case 'info':
          return <HelpCircle className="gi-badge-icon" />;
        case 'in_progress':
          return <PlayCircle className="gi-badge-icon" />;
        case 'pending':
          return <Clock className="gi-badge-icon" />;
        case 'technical':
          return <CheckCircle2 className="gi-badge-icon" />;
        case 'behavioral':
          return <HelpCircle className="gi-badge-icon" />;
        case 'mixed':
          return <AlertCircle className="gi-badge-icon" />;
        default:
          return null;
      }
    };

    const getStatusText = (variant: StatusVariant) => {
      switch (variant) {
        case 'in_progress':
          return 'In Progress';
        case 'technical':
          return 'Technical';
        case 'behavioral':
          return 'Behavioral';
        case 'mixed':
          return 'Mixed';
        default:
          return variant.charAt(0).toUpperCase() + variant.slice(1);
      }
    };

    const badgeClasses = cn(
      'gi-badge',
      `gi-badge-${variant}`,
      `gi-badge-${size}`,
      className
    );

    return (
      <span
        ref={ref}
        className={badgeClasses}
        {...props}
      >
        {showIcon && getIcon(variant)}
        <span className="gi-badge-text">
          {children || getStatusText(variant)}
        </span>
      </span>
    );
  }
);

StatusBadge.displayName = 'StatusBadge';

export { StatusBadge };