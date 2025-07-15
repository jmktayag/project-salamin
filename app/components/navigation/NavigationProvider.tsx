'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { NavigationContextType, NavigationPage, InterviewStep } from './types';
import { useAuth } from '../AuthProvider';

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

interface NavigationProviderProps {
  children: ReactNode;
}

export function NavigationProvider({ children }: NavigationProviderProps) {
  const { user, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState<NavigationPage>('home');
  const [interviewStep, setInterviewStep] = useState<InterviewStep>('configuration');
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [resetToHomeCallback, setResetToHomeCallback] = useState<(() => void) | null>(null);

  // Set default page based on authentication state
  useEffect(() => {
    // Only update the page if auth loading is complete and we're on the home page
    if (!loading && currentPage === 'home' && !interviewStarted) {
      if (user) {
        // Authenticated users default to dashboard (history page)
        setCurrentPage('history');
      } else {
        // Unauthenticated users stay on home page (landing page)
        setCurrentPage('home');
      }
    }
  }, [user, loading, currentPage, interviewStarted]);

  // Scroll to top when interview step changes
  useEffect(() => {
    if (interviewStarted) {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  }, [interviewStep, interviewStarted]);

  // Scroll to top when current page changes
  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }, [currentPage]);

  const resetNavigation = useCallback(() => {
    setCurrentPage('home');
    setInterviewStep('configuration');
    setInterviewStarted(false);
  }, []);

  const registerResetToHome = useCallback((callback: () => void) => {
    setResetToHomeCallback(() => callback);
  }, []);

  const resetToHome = useCallback(() => {
    if (resetToHomeCallback) {
      resetToHomeCallback();
    } else {
      resetNavigation();
    }
  }, [resetToHomeCallback, resetNavigation]);

  const contextValue: NavigationContextType = {
    currentPage,
    interviewStep,
    interviewStarted,
    setCurrentPage,
    setInterviewStep,
    setInterviewStarted,
    resetNavigation,
    resetToHome,
    registerResetToHome,
  };

  return (
    <NavigationContext.Provider value={contextValue}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation(): NavigationContextType {
  const context = useContext(NavigationContext);
  if (context === undefined) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
}