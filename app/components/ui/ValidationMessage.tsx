'use client';

import React from 'react';
import { AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react';
import { cn } from '../../utils/cn';

interface ValidationMessageProps {
  type: 'error' | 'warning' | 'success';
  messages: string[];
  fieldId?: string;
  className?: string;
}

export function ValidationMessage({ 
  type, 
  messages, 
  fieldId, 
  className 
}: ValidationMessageProps) {
  if (messages.length === 0) return null;

  const baseId = fieldId ? `${fieldId}-validation` : undefined;
  const ariaId = baseId ? `${baseId}-${type}` : undefined;

  const iconMap = {
    error: AlertCircle,
    warning: AlertTriangle,
    success: CheckCircle
  };

  const styleMap = {
    error: 'text-red-600 bg-red-50 border-red-200',
    warning: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    success: 'text-green-600 bg-green-50 border-green-200'
  };

  const Icon = iconMap[type];

  return (
    <div
      id={ariaId}
      role={type === 'error' ? 'alert' : 'status'}
      aria-live={type === 'error' ? 'assertive' : 'polite'}
      className={cn(
        'mt-2 p-2 rounded-md border text-sm',
        styleMap[type],
        className
      )}
    >
      <div className="flex items-start space-x-2">
        <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          {messages.length === 1 ? (
            <span>{messages[0]}</span>
          ) : (
            <ul className="list-disc list-inside space-y-1">
              {messages.map((message, index) => (
                <li key={index}>{message}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

interface FieldValidationProps {
  errors?: string[];
  warnings?: string[];
  success?: string[];
  fieldId?: string;
  className?: string;
}

export function FieldValidation({ 
  errors = [], 
  warnings = [], 
  success = [], 
  fieldId, 
  className 
}: FieldValidationProps) {
  return (
    <div className={className}>
      {errors.length > 0 && (
        <ValidationMessage 
          type="error" 
          messages={errors} 
          fieldId={fieldId}
        />
      )}
      {warnings.length > 0 && (
        <ValidationMessage 
          type="warning" 
          messages={warnings} 
          fieldId={fieldId}
        />
      )}
      {success.length > 0 && (
        <ValidationMessage 
          type="success" 
          messages={success} 
          fieldId={fieldId}
        />
      )}
    </div>
  );
}