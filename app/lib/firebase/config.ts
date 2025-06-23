import { initializeApp } from 'firebase/app';
import { getAnalytics, Analytics, isSupported } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Analytics (only in browser environment)
let analytics: Analytics | null = null;

export const initializeAnalytics = async (): Promise<Analytics | null> => {
  if (typeof window !== 'undefined' && await isSupported()) {
    try {
      analytics = getAnalytics(app);
      return analytics;
    } catch (error) {
      console.warn('Firebase Analytics initialization failed:', error);
      return null;
    }
  }
  return null;
};

export const getAnalyticsInstance = (): Analytics | null => {
  return analytics;
};

export default app;