'use client';

import React from 'react';
import { CheckCircle, AlertCircle, Lightbulb } from 'lucide-react';
import { cn } from '../../utils/cn';

export type FeedbackType = 'success' | 'warning' | 'suggestion';

export interface FeedbackItem {
  type: FeedbackType;
  text: string;
  id?: string;
}

export interface FeedbackItemProps extends React.HTMLAttributes<HTMLLIElement> {
  item: FeedbackItem;
  size?: 'sm' | 'md' | 'lg';
}

const FeedbackItemComponent = React.forwardRef<HTMLLIElement, FeedbackItemProps>(
  ({ item, size = 'md', className, ...props }, ref) => {
    const getIcon = (type: FeedbackType) => {
      const iconClass = cn(
        'gi-feedback-icon',
        `gi-feedback-icon-${size}`
      );
      
      switch (type) {
        case 'success':
          return <CheckCircle className={iconClass} />;
        case 'warning':
          return <AlertCircle className={iconClass} />;
        case 'suggestion':
          return <Lightbulb className={iconClass} />;
        default:
          return null;
      }
    };

    const itemClasses = cn(
      'gi-feedback-item',
      `gi-feedback-item-${item.type}`,
      `gi-feedback-item-${size}`,
      className
    );

    return (
      <li 
        ref={ref}
        className={itemClasses}
        {...props}
      >
        <span className="gi-feedback-icon-wrapper">
          {getIcon(item.type)}
        </span>
        <p className="gi-feedback-text">
          {item.text}
        </p>
      </li>
    );
  }
);

FeedbackItemComponent.displayName = 'FeedbackItem';

export interface FeedbackListProps extends React.HTMLAttributes<HTMLElement> {
  feedback: FeedbackItem[];
  title?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'compact' | 'bordered';
  emptyMessage?: string;
  showIcon?: boolean;
}

const FeedbackList = React.forwardRef<HTMLElement, FeedbackListProps>(
  ({ 
    feedback,
    title = 'AI Feedback:',
    size = 'md',
    variant = 'default',
    emptyMessage = 'No feedback available',
    className,
    ...props 
  }, ref) => {
    const containerClasses = cn(
      'gi-feedback-list',
      `gi-feedback-list-${variant}`,
      `gi-feedback-list-${size}`,
      className
    );

    if (feedback.length === 0) {
      return (
        <section 
          ref={ref}
          className={containerClasses}
          {...props}
        >
          {title && (
            <h2 className="gi-feedback-title">
              {title}
            </h2>
          )}
          <p className="gi-feedback-empty">
            {emptyMessage}
          </p>
        </section>
      );
    }

    return (
      <section 
        ref={ref}
        aria-labelledby={title ? 'feedback-title' : undefined}
        className={containerClasses}
        {...props}
      >
        {title && (
          <h2 id="feedback-title" className="gi-feedback-title">
            {title}
          </h2>
        )}
        <ul className="gi-feedback-items" role="list">
          {feedback.map((item, index) => (
            <FeedbackItemComponent
              key={item.id || index}
              item={item}
              size={size}
            />
          ))}
        </ul>
      </section>
    );
  }
);

FeedbackList.displayName = 'FeedbackList';

export { FeedbackList, FeedbackItemComponent as FeedbackItem };