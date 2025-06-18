'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { NavigationContextType, NavigationPage, InterviewStep } from './types';

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

interface NavigationProviderProps {
  children: ReactNode;
}

export function NavigationProvider({ children }: NavigationProviderProps) {
  const [currentPage, setCurrentPage] = useState<NavigationPage>('home');
  const [interviewStep, setInterviewStep] = useState<InterviewStep>('configuration');
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [resetToHomeCallback, setResetToHomeCallback] = useState<(() => void) | null>(null);

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