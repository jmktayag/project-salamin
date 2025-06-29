'use client';

import React from 'react';
import { cn } from '../../utils/cn';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'interactive' | 'elevated';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  as?: React.ElementType;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ 
    className, 
    variant = 'default',
    padding = 'md',
    as: Component = 'div',
    children,
    ...props 
  }, ref) => {
    const cardClasses = cn(
      'gi-card',
      variant === 'interactive' && 'gi-card-interactive',
      variant === 'elevated' && 'gi-card-elevated',
      padding !== 'none' && `gi-card-padding-${padding}`,
      className
    );

    return (
      <Component
        ref={ref}
        className={cardClasses}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

Card.displayName = 'Card';

export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  as?: React.ElementType;
}

const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, as: Component = 'div', ...props }, ref) => (
    <Component
      ref={ref}
      className={cn('gi-card-header', className)}
      {...props}
    />
  )
);

CardHeader.displayName = 'CardHeader';

export interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  as?: React.ElementType;
}

const CardTitle = React.forwardRef<HTMLParagraphElement, CardTitleProps>(
  ({ className, as: Component = 'h2', ...props }, ref) => (
    <Component
      ref={ref}
      className={cn('gi-card-title', className)}
      {...props}
    />
  )
);

CardTitle.displayName = 'CardTitle';

export interface CardDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {
  as?: React.ElementType;
}

const CardDescription = React.forwardRef<HTMLParagraphElement, CardDescriptionProps>(
  ({ className, as: Component = 'p', ...props }, ref) => (
    <Component
      ref={ref}
      className={cn('gi-card-description', className)}
      {...props}
    />
  )
);

CardDescription.displayName = 'CardDescription';

export interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {}

const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('gi-card-content', className)}
      {...props}
    />
  )
);

CardContent.displayName = 'CardContent';

export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {}

const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('gi-card-footer', className)}
      {...props}
    />
  )
);

CardFooter.displayName = 'CardFooter';

export { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent, 
  CardFooter 
};