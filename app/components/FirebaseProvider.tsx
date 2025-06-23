'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Analytics } from 'firebase/analytics';
import { initializeAnalytics } from '../lib/firebase/config';
import { AnalyticsContext } from '../lib/firebase/types';

interface FirebaseContextValue {
  analytics: Analytics | null;
  isInitialized: boolean;
  context: AnalyticsContext;
}

const FirebaseContext = createContext<FirebaseContextValue | null>(null);

interface FirebaseProviderProps {
  children: React.ReactNode;
}

export function FirebaseProvider({ children }: FirebaseProviderProps) {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const context: AnalyticsContext = {
    isEnabled: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY && process.env.NODE_ENV !== 'development',
    isDevelopment: process.env.NODE_ENV === 'development'
  };

  useEffect(() => {
    const initFirebase = async () => {
      try {
        if (context.isEnabled && !context.isDevelopment) {
          const analyticsInstance = await initializeAnalytics();
          setAnalytics(analyticsInstance);
          console.log('[Firebase] Analytics initialized for production');
        } else if (context.isDevelopment) {
          console.log('[Firebase] Analytics disabled in development mode - events will only log to console');
        }
      } catch (error) {
        console.warn('Firebase initialization error:', error);
      } finally {
        setIsInitialized(true);
      }
    };

    initFirebase();
  }, [context.isEnabled, context.isDevelopment]);

  return (
    <FirebaseContext.Provider value={{ analytics, isInitialized, context }}>
      {children}
    </FirebaseContext.Provider>
  );
}

export function useFirebaseAnalytics(): FirebaseContextValue {
  const context = useContext(FirebaseContext);
  if (!context) {
    throw new Error('useFirebaseAnalytics must be used within a FirebaseProvider');
  }
  return context;
}