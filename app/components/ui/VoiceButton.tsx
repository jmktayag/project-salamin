'use client';

import React from 'react';
import { Button, ButtonProps } from './Button';
import { cn } from '../../utils/cn';

export interface VoiceButtonProps extends Omit<ButtonProps, 'iconOnly'> {
  isRecording?: boolean;
  isListening?: boolean;
  isSupported?: boolean;
  microphoneIcon?: React.ReactNode;
  stopIcon?: React.ReactNode;
}

/**
 * Voice input button component specifically designed for speech recognition
 * Handles recording states, visual feedback, and accessibility for voice input
 */
export const VoiceButton = React.forwardRef<HTMLButtonElement, VoiceButtonProps>(
  ({ 
    className,
    isRecording = false,
    isListening = false,
    isSupported = true,
    microphoneIcon,
    stopIcon,
    disabled,
    variant = 'accent',
    size = 'lg',
    'aria-label': ariaLabel,
    children,
    ...props 
  }, ref) => {
    const isDisabled = disabled || !isSupported;
    
    // Default microphone icon
    const defaultMicIcon = (
      <svg 
        className="h-5 w-5" 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" 
        />
      </svg>
    );

    // Default stop icon
    const defaultStopIcon = (
      <svg 
        className="h-5 w-5" 
        fill="currentColor" 
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <rect x="6" y="6" width="12" height="12" rx="2" />
      </svg>
    );

    // Determine which icon to show
    const currentIcon = isRecording 
      ? (stopIcon || defaultStopIcon)
      : (microphoneIcon || defaultMicIcon);

    // Generate accessible label
    const getAccessibleLabel = () => {
      if (ariaLabel) return ariaLabel;
      if (!isSupported) return 'Voice input not supported';
      if (isRecording) return 'Stop recording';
      return 'Start voice recording';
    };

    // Determine button state
    const getButtonState = () => {
      if (isListening) return 'loading';
      return 'default';
    };

    return (
      <Button
        ref={ref}
        className={cn(
          // Recording state styling
          isRecording && 'animate-pulse',
          // Listening state styling  
          isListening && 'ring-2 ring-amber-300',
          className
        )}
        iconOnly
        variant={variant}
        size={size}
        state={getButtonState()}
        disabled={isDisabled}
        aria-label={getAccessibleLabel()}
        aria-pressed={isRecording}
        {...props}
      >
        {currentIcon}
        {/* Screen reader content */}
        <span className="sr-only">
          {children || getAccessibleLabel()}
        </span>
      </Button>
    );
  }
);

VoiceButton.displayName = 'VoiceButton';