'use client';

import React from 'react';
import { X, Lightbulb } from 'lucide-react';

export interface FloatingHintPanelProps {
  isOpen: boolean;
  isVisible: boolean;
  isAnimating: boolean;
  deviceType: 'mobile' | 'desktop';
  tips: string[];
  onClose: () => void;
  panelRef?: React.RefObject<HTMLDivElement>;
}

/**
 * Floating hint panel that adapts to desktop (right sidebar) and mobile (bottom sheet)
 * Includes smooth animations, backdrop blur, and accessibility features
 */
export const FloatingHintPanel: React.FC<FloatingHintPanelProps> = ({
  isOpen,
  isVisible,
  isAnimating: _isAnimating,
  deviceType,
  tips,
  onClose,
  panelRef,
}) => {
  if (!isOpen) return null;

  const isDesktop = deviceType === 'desktop';
  const isMobile = deviceType === 'mobile';

  return (
    <>
      {/* Mobile backdrop overlay */}
      {isMobile && (
        <div
          className={`
            fixed inset-0 z-40
            bg-black/20 backdrop-blur-sm
            transition-opacity duration-300
            ${isVisible ? 'opacity-100' : 'opacity-0'}
          `}
          aria-hidden="true"
        />
      )}

      {/* Panel container */}
      <div
        ref={panelRef}
        className={`
          fixed z-50
          bg-white border border-gray-200 shadow-xl
          transition-transform duration-300 ease-out
          flex flex-col overflow-hidden
        `}
        style={{
          ...(isDesktop ? {
            top: '6rem',
            right: '1rem',
            bottom: '1rem',
            width: '320px',
            borderRadius: '12px',
            transform: isVisible ? 'translateX(0)' : 'translateX(100%)',
          } : {
            left: '1rem',
            right: '1rem',
            bottom: '1rem',
            maxHeight: '50vh',
            borderRadius: '12px 12px 0 0',
            transform: isVisible ? 'translateY(0)' : 'translateY(100%)',
          }),
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="hint-panel-title"
        aria-describedby="hint-panel-description"
      >
        {/* Panel Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50 rounded-t-xl">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-amber-500" />
            <h2 id="hint-panel-title" className="text-lg font-semibold text-gray-800">
              Interview Hints
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="
              p-1 rounded-full 
              text-gray-400 hover:text-gray-600 hover:bg-gray-200
              transition-colors duration-200
              focus:outline-none focus:ring-2 focus:ring-amber-500
            "
            aria-label="Close hints panel"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Panel Content */}
        <div 
          className={`
            flex-1 overflow-y-auto p-4
            ${isMobile ? 'max-h-80' : 'h-full'}
          `}
        >
          <p id="hint-panel-description" className="text-sm text-gray-600 mb-4">
            Here are some tips to help you craft a strong response:
          </p>
          
          {tips.length > 0 ? (
            <ul className="space-y-3" role="list">
              {tips.map((tip, index) => (
                <li 
                  key={index} 
                  className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg border border-amber-100"
                  role="listitem"
                >
                  <span 
                    className="flex-shrink-0 w-6 h-6 bg-amber-200 text-amber-800 rounded-full flex items-center justify-center text-sm font-medium mt-0.5"
                    aria-label={`Tip ${index + 1}`}
                  >
                    {index + 1}
                  </span>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {tip}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-8">
              <Lightbulb className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">
                No hints available for this question.
              </p>
            </div>
          )}
        </div>

        {/* Mobile: Pull indicator */}
        {isMobile && (
          <div className="flex justify-center py-2">
            <div className="w-12 h-1 bg-gray-300 rounded-full" />
          </div>
        )}
      </div>
    </>
  );
};