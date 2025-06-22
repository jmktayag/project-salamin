'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useResponsiveLayout } from './useResponsiveLayout';

export interface FloatingHintState {
  isOpen: boolean;
  isVisible: boolean;
  isAnimating: boolean;
}

export interface FloatingHintActions {
  open: () => void;
  close: () => void;
  toggle: () => void;
  reset: () => void;
}

export interface UseFloatingHintOptions {
  closeOnEscape?: boolean;
  closeOnClickOutside?: boolean;
  animationDuration?: number;
}

export interface UseFloatingHintReturn {
  state: FloatingHintState;
  actions: FloatingHintActions;
  panelRef: React.RefObject<HTMLDivElement>;
  buttonRef: React.RefObject<HTMLButtonElement>;
  deviceType: 'mobile' | 'desktop';
  isDesktop: boolean;
  isMobile: boolean;
}

/**
 * Custom hook for managing floating hint panel state and interactions
 * Handles opening/closing, animations, keyboard navigation, and click-outside behavior
 */
export function useFloatingHint(options: UseFloatingHintOptions = {}): UseFloatingHintReturn {
  const {
    closeOnEscape = true,
    closeOnClickOutside = true,
    animationDuration = 300,
  } = options;

  const { deviceType, isDesktop, isMobile } = useResponsiveLayout();
  
  const [state, setState] = useState<FloatingHintState>({
    isOpen: false,
    isVisible: false,
    isAnimating: false,
  });

  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const animationTimeoutRef = useRef<NodeJS.Timeout>();

  const open = useCallback(() => {
    setState(prev => ({
      ...prev,
      isOpen: true,
      isAnimating: true,
    }));

    // Start animation
    requestAnimationFrame(() => {
      setState(prev => ({
        ...prev,
        isVisible: true,
      }));
    });

    // End animation
    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current);
    }
    animationTimeoutRef.current = setTimeout(() => {
      setState(prev => ({
        ...prev,
        isAnimating: false,
      }));
    }, animationDuration);
  }, [animationDuration]);

  const close = useCallback(() => {
    setState(prev => ({
      ...prev,
      isVisible: false,
      isAnimating: true,
    }));

    // End animation and close
    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current);
    }
    animationTimeoutRef.current = setTimeout(() => {
      setState(prev => ({
        ...prev,
        isOpen: false,
        isAnimating: false,
      }));
    }, animationDuration);
  }, [animationDuration]);

  const toggle = useCallback(() => {
    if (state.isOpen) {
      close();
    } else {
      open();
    }
  }, [state.isOpen, open, close]);

  const reset = useCallback(() => {
    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current);
    }
    setState({
      isOpen: false,
      isVisible: false,
      isAnimating: false,
    });
  }, []);

  // Handle Escape key
  useEffect(() => {
    if (!closeOnEscape || !state.isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        close();
        // Return focus to button
        buttonRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [closeOnEscape, state.isOpen, close]);

  // Handle click outside
  useEffect(() => {
    if (!closeOnClickOutside || !state.isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      
      // Don't close if clicking on the button or panel
      if (
        buttonRef.current?.contains(target) ||
        panelRef.current?.contains(target)
      ) {
        return;
      }

      close();
    };

    // Use capture phase to handle clicks before other handlers
    document.addEventListener('mousedown', handleClickOutside, true);
    return () => document.removeEventListener('mousedown', handleClickOutside, true);
  }, [closeOnClickOutside, state.isOpen, close]);

  // Focus management
  useEffect(() => {
    if (state.isOpen && state.isVisible && !state.isAnimating) {
      // Focus first focusable element in panel
      const firstFocusable = panelRef.current?.querySelector(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      ) as HTMLElement;
      
      if (firstFocusable) {
        firstFocusable.focus();
      }
    }
  }, [state.isOpen, state.isVisible, state.isAnimating]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
    };
  }, []);

  // Reset state when device type changes
  useEffect(() => {
    reset();
  }, [deviceType, reset]);

  return {
    state,
    actions: {
      open,
      close,
      toggle,
      reset,
    },
    panelRef,
    buttonRef,
    deviceType,
    isDesktop,
    isMobile,
  };
}