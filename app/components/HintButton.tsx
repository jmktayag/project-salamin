'use client';

import React from 'react';
import { Lightbulb } from 'lucide-react';

export interface HintButtonProps {
  onClick: () => void;
  isOpen: boolean;
  disabled?: boolean;
  className?: string;
  buttonRef?: React.RefObject<HTMLButtonElement>;
}

/**
 * Floating hint button component that provides persistent access to hints
 * Positioned as a fixed floating action button
 */
export const HintButton: React.FC<HintButtonProps> = ({
  onClick,
  isOpen,
  disabled = false,
  className = '',
  buttonRef,
}) => {
  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`
        fixed z-50 
        w-14 h-14 
        bg-amber-500 hover:bg-amber-600 
        text-white 
        rounded-full 
        shadow-lg hover:shadow-xl 
        transition-all duration-300 
        flex items-center justify-center
        focus:outline-none focus:ring-4 focus:ring-amber-200
        disabled:opacity-50 disabled:cursor-not-allowed
        group
        ${isOpen ? 'bg-amber-600 shadow-xl scale-110' : ''}
        ${className}
      `}
      style={{
        bottom: '2rem',
        right: '2rem',
      }}
      aria-label={isOpen ? 'Close hints' : 'Show hints'}
      aria-expanded={isOpen}
      title={isOpen ? 'Close hints' : 'Show hints'}
    >
      <Lightbulb 
        className={`
          w-6 h-6 
          transition-transform duration-300
          ${isOpen ? 'rotate-12 scale-110' : 'group-hover:scale-110'}
        `}
      />
      
      {/* Pulse animation when not open */}
      {!isOpen && (
        <div className="absolute inset-0 rounded-full bg-amber-500 animate-ping opacity-20" />
      )}
      
      {/* Accessibility: Screen reader text */}
      <span className="sr-only">
        {isOpen ? 'Close hint panel' : 'Open hint panel'}
      </span>
    </button>
  );
};