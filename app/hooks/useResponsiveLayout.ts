'use client';

import { useState, useEffect } from 'react';

export type DeviceType = 'mobile' | 'desktop';

export interface ResponsiveLayoutState {
  deviceType: DeviceType;
  isDesktop: boolean;
  isMobile: boolean;
  windowWidth: number;
  windowHeight: number;
}

const DESKTOP_BREAKPOINT = 1024; // lg breakpoint

/**
 * Custom hook for responsive layout detection and window size tracking
 * Handles device type detection and provides window dimensions
 */
export function useResponsiveLayout(): ResponsiveLayoutState {
  const [state, setState] = useState<ResponsiveLayoutState>(() => {
    // Initialize with safe defaults for SSR
    if (typeof window === 'undefined') {
      return {
        deviceType: 'desktop',
        isDesktop: true,
        isMobile: false,
        windowWidth: DESKTOP_BREAKPOINT,
        windowHeight: 768,
      };
    }

    const width = window.innerWidth;
    const height = window.innerHeight;
    const isDesktop = width >= DESKTOP_BREAKPOINT;

    return {
      deviceType: isDesktop ? 'desktop' : 'mobile',
      isDesktop,
      isMobile: !isDesktop,
      windowWidth: width,
      windowHeight: height,
    };
  });

  useEffect(() => {
    // Skip if SSR
    if (typeof window === 'undefined') return;

    let timeoutId: NodeJS.Timeout;

    const updateLayout = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const isDesktop = width >= DESKTOP_BREAKPOINT;

      setState({
        deviceType: isDesktop ? 'desktop' : 'mobile',
        isDesktop,
        isMobile: !isDesktop,
        windowWidth: width,
        windowHeight: height,
      });
    };

    // Debounced resize handler to avoid excessive updates
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(updateLayout, 150);
    };

    // ResizeObserver for better performance if available
    let resizeObserver: ResizeObserver | null = null;
    
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(handleResize);
      resizeObserver.observe(document.documentElement);
    } else {
      // Fallback to window resize event
      window.addEventListener('resize', handleResize, { passive: true });
    }

    // Handle orientation change on mobile devices
    const handleOrientationChange = () => {
      // Small delay to allow for orientation change to complete
      setTimeout(updateLayout, 100);
    };

    window.addEventListener('orientationchange', handleOrientationChange, { passive: true });

    // Initial layout update
    updateLayout();

    return () => {
      clearTimeout(timeoutId);
      
      if (resizeObserver) {
        resizeObserver.disconnect();
      } else {
        window.removeEventListener('resize', handleResize);
      }
      
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, []);

  return state;
}