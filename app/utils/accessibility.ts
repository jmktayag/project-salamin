/**
 * Accessibility utilities for focus management, ARIA helpers, and keyboard navigation
 */

import { useEffect, useRef, useCallback } from 'react';

/**
 * Generate unique IDs for accessibility attributes
 */
export function useAccessibleId(prefix = 'component'): string {
  const idRef = useRef<string>();
  
  if (!idRef.current) {
    idRef.current = `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
  }
  
  return idRef.current;
}

/**
 * Focus management hook for form sections
 */
export function useFocusManagement() {
  const focusRef = useRef<HTMLElement | null>(null);
  
  const setFocusRef = useCallback((element: HTMLElement | null) => {
    focusRef.current = element;
  }, []);
  
  const focusElement = useCallback(() => {
    if (focusRef.current) {
      focusRef.current.focus();
    }
  }, []);
  
  const focusFirstError = useCallback((containerSelector?: string) => {
    const container = containerSelector 
      ? document.querySelector(containerSelector)
      : document;
    
    if (!container) return;
    
    const errorElement = container.querySelector('[aria-invalid="true"], [role="alert"]') as HTMLElement;
    if (errorElement) {
      errorElement.focus();
      errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, []);
  
  return {
    setFocusRef,
    focusElement,
    focusFirstError
  };
}

/**
 * Keyboard navigation hook
 */
export function useKeyboardNavigation(options: {
  onEscape?: () => void;
  onEnter?: () => void;
  onTab?: (event: KeyboardEvent) => void;
  onArrowUp?: () => void;
  onArrowDown?: () => void;
} = {}) {
  const { onEscape, onEnter, onTab, onArrowUp, onArrowDown } = options;
  
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Skip keyboard navigation when user is typing in text inputs
    const target = event.target as HTMLElement;
    const isTextInput = target.tagName === 'INPUT' || 
                       target.tagName === 'TEXTAREA' || 
                       target.tagName === 'SELECT' ||
                       target.isContentEditable ||
                       target.getAttribute('role') === 'textbox';
    
    if (isTextInput) {
      return; // Let normal text input behavior work
    }

    switch (event.key) {
      case 'Escape':
        onEscape?.();
        break;
      case 'Enter':
        if (!event.shiftKey) {
          onEnter?.();
        }
        break;
      case 'Tab':
        onTab?.(event);
        break;
      case 'ArrowUp':
        onArrowUp?.();
        break;
      case 'ArrowDown':
        onArrowDown?.();
        break;
    }
  }, [onEscape, onEnter, onTab, onArrowUp, onArrowDown]);
  
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
  
  return { handleKeyDown };
}

/**
 * Screen reader announcements
 */
export class ScreenReaderAnnouncer {
  private static instance: ScreenReaderAnnouncer;
  private liveRegion: HTMLElement | null = null;
  
  static getInstance(): ScreenReaderAnnouncer {
    if (!ScreenReaderAnnouncer.instance) {
      ScreenReaderAnnouncer.instance = new ScreenReaderAnnouncer();
    }
    return ScreenReaderAnnouncer.instance;
  }
  
  private ensureLiveRegion(): void {
    if (!this.liveRegion) {
      this.liveRegion = document.createElement('div');
      this.liveRegion.setAttribute('aria-live', 'polite');
      this.liveRegion.setAttribute('aria-atomic', 'true');
      this.liveRegion.className = 'sr-only';
      this.liveRegion.style.cssText = `
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
      `;
      document.body.appendChild(this.liveRegion);
    }
  }
  
  announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    this.ensureLiveRegion();
    
    if (this.liveRegion) {
      this.liveRegion.setAttribute('aria-live', priority);
      this.liveRegion.textContent = message;
      
      // Clear after announcement
      setTimeout(() => {
        if (this.liveRegion) {
          this.liveRegion.textContent = '';
        }
      }, 1000);
    }
  }
  
  announceFormErrors(errors: Record<string, string[]>): void {
    const errorCount = Object.values(errors).flat().length;
    if (errorCount > 0) {
      const message = `${errorCount} form error${errorCount === 1 ? '' : 's'} found. Please review and correct the highlighted fields.`;
      this.announce(message, 'assertive');
    }
  }
  
  announceSuccess(message: string): void {
    this.announce(message, 'polite');
  }
}

/**
 * ARIA attributes helpers
 */
export interface AriaAttributes {
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  'aria-required'?: boolean;
  'aria-invalid'?: boolean;
  'aria-expanded'?: boolean;
  'aria-controls'?: string;
  'aria-live'?: 'polite' | 'assertive' | 'off';
  'aria-atomic'?: boolean;
  role?: string;
}

export function buildAriaAttributes(options: {
  label?: string;
  labelledBy?: string;
  describedBy?: string;
  required?: boolean;
  invalid?: boolean;
  expanded?: boolean;
  controls?: string;
  live?: 'polite' | 'assertive' | 'off';
  atomic?: boolean;
  role?: string;
}): AriaAttributes {
  const attributes: AriaAttributes = {};
  
  if (options.label) attributes['aria-label'] = options.label;
  if (options.labelledBy) attributes['aria-labelledby'] = options.labelledBy;
  if (options.describedBy) attributes['aria-describedby'] = options.describedBy;
  if (options.required) attributes['aria-required'] = options.required;
  if (options.invalid !== undefined) attributes['aria-invalid'] = options.invalid;
  if (options.expanded !== undefined) attributes['aria-expanded'] = options.expanded;
  if (options.controls) attributes['aria-controls'] = options.controls;
  if (options.live) attributes['aria-live'] = options.live;
  if (options.atomic !== undefined) attributes['aria-atomic'] = options.atomic;
  if (options.role) attributes.role = options.role;
  
  return attributes;
}

/**
 * Form accessibility helpers
 */
export function buildFieldAccessibility(fieldName: string, options: {
  label?: string;
  required?: boolean;
  hasError?: boolean;
  hasHelperText?: boolean;
  fieldId?: string;
}) {
  const { label, required, hasError, hasHelperText, fieldId } = options;
  const id = fieldId || fieldName;
  
  const describedByIds: string[] = [];
  
  if (hasError) {
    describedByIds.push(`${id}-validation-error`);
  }
  
  if (hasHelperText) {
    describedByIds.push(`${id}-helper`);
  }
  
  return buildAriaAttributes({
    label: label,
    required: required,
    invalid: hasError,
    describedBy: describedByIds.length > 0 ? describedByIds.join(' ') : undefined
  });
}

/**
 * Skip link component helpers
 */
export function createSkipLink(targetId: string, text: string): string {
  return `
    <a 
      href="#${targetId}" 
      class="skip-link sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded"
    >
      ${text}
    </a>
  `;
}

/**
 * Color contrast checker (basic implementation)
 */
export function checkColorContrast(foreground: string, background: string): {
  ratio: number;
  wcagAA: boolean;
  wcagAAA: boolean;
} {
  // This is a simplified implementation
  // In production, you'd want to use a more comprehensive color contrast library
  
  // Convert hex to RGB
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  };
  
  // Calculate relative luminance
  const getLuminance = (r: number, g: number, b: number) => {
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  };
  
  const fg = hexToRgb(foreground);
  const bg = hexToRgb(background);
  
  if (!fg || !bg) {
    return { ratio: 1, wcagAA: false, wcagAAA: false };
  }
  
  const fgLum = getLuminance(fg.r, fg.g, fg.b);
  const bgLum = getLuminance(bg.r, bg.g, bg.b);
  
  const ratio = (Math.max(fgLum, bgLum) + 0.05) / (Math.min(fgLum, bgLum) + 0.05);
  
  return {
    ratio,
    wcagAA: ratio >= 4.5,
    wcagAAA: ratio >= 7
  };
}

/**
 * Hook for managing focus trap (for modals, etc.)
 */
export function useFocusTrap(isActive: boolean) {
  const containerRef = useRef<HTMLElement>(null);
  
  useEffect(() => {
    if (!isActive || !containerRef.current) return;
    
    const container = containerRef.current;
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>;
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    
    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      
      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement?.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement?.focus();
          e.preventDefault();
        }
      }
    };
    
    // Focus first element when activated
    firstElement?.focus();
    
    document.addEventListener('keydown', handleTabKey);
    
    return () => {
      document.removeEventListener('keydown', handleTabKey);
    };
  }, [isActive]);
  
  return containerRef;
}