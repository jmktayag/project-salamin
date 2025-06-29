'use client';

import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface ProgressIndicatorProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
  max?: number;
  variant?: 'default' | 'success' | 'warning' | 'error';
  size?: 'sm' | 'md' | 'lg';
  showPercentage?: boolean;
  showSteps?: boolean;
  label?: string;
  steps?: string[];
  currentStep?: number;
}

const ProgressIndicator = React.forwardRef<HTMLDivElement, ProgressIndicatorProps>(
  ({ 
    value,
    max = 100,
    variant = 'default',
    size = 'md',
    showPercentage = true,
    showSteps = false,
    label,
    steps = [],
    currentStep = 0,
    className,
    ...props 
  }, ref) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
    const isComplete = percentage >= 100;

    const containerClasses = cn(
      'gi-progress',
      `gi-progress-${size}`,
      className
    );

    const barClasses = cn(
      'gi-progress-bar',
      `gi-progress-bar-${variant}`,
      isComplete && 'gi-progress-bar-complete'
    );

    const fillClasses = cn(
      'gi-progress-fill',
      `gi-progress-fill-${variant}`
    );

    return (
      <div
        ref={ref}
        className={containerClasses}
        {...props}
      >
        {(label || showPercentage) && (
          <div className="gi-progress-header">
            {label && (
              <span className="gi-progress-label">
                {label}
              </span>
            )}
            {showPercentage && (
              <span className="gi-progress-percentage">
                {isComplete && <CheckCircle2 className="gi-progress-complete-icon" />}
                {Math.round(percentage)}%
              </span>
            )}
          </div>
        )}

        <div 
          className={barClasses}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
          aria-label={label || `Progress: ${Math.round(percentage)}%`}
        >
          <div 
            className={fillClasses}
            style={{ width: `${percentage}%` }}
          />
        </div>

        {showSteps && steps.length > 0 && (
          <div className="gi-progress-steps">
            {steps.map((step, index) => (
              <div
                key={index}
                className={cn(
                  'gi-progress-step',
                  index < currentStep && 'gi-progress-step-completed',
                  index === currentStep && 'gi-progress-step-current',
                  index > currentStep && 'gi-progress-step-pending'
                )}
              >
                <div className="gi-progress-step-indicator">
                  {index < currentStep ? (
                    <CheckCircle2 className="gi-progress-step-icon" />
                  ) : (
                    <span className="gi-progress-step-number">
                      {index + 1}
                    </span>
                  )}
                </div>
                <span className="gi-progress-step-label">
                  {step}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
);

ProgressIndicator.displayName = 'ProgressIndicator';

export { ProgressIndicator };