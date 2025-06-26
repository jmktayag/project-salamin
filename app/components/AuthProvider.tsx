'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  updateProfile,
  sendPasswordResetEmail,
  User
} from 'firebase/auth';
import { auth } from '../lib/firebase/config';
import { AuthContextType, AuthProviderProps, AuthUser } from '../lib/firebase/auth-types';
import { trackUserSignedIn, trackUserSignedUp, trackUserSignedOut } from '../lib/firebase/analytics';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authStartTime] = useState(Date.now());

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser: User | null) => {
      if (firebaseUser) {
        setUser({
          ...firebaseUser,
          displayName: firebaseUser.displayName,
          email: firebaseUser.email,
          photoURL: firebaseUser.photoURL,
        } as AuthUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const handleAuthError = (err: unknown) => {
    const error = err as { code?: string; message?: string };
    const errorCode = error?.code;
    let errorMessage = 'An unexpected error occurred';

    switch (errorCode) {
      case 'auth/user-not-found':
        errorMessage = 'No account found with this email address';
        break;
      case 'auth/wrong-password':
        errorMessage = 'Incorrect password';
        break;
      case 'auth/email-already-in-use':
        errorMessage = 'An account with this email already exists';
        break;
      case 'auth/weak-password':
        errorMessage = 'Password should be at least 6 characters';
        break;
      case 'auth/invalid-email':
        errorMessage = 'Please enter a valid email address';
        break;
      case 'auth/too-many-requests':
        errorMessage = 'Too many failed attempts. Please try again later';
        break;
      default:
        errorMessage = error?.message || errorMessage;
    }

    setError(errorMessage);
    throw new Error(errorMessage);
  };

  const signIn = async (email: string, password: string): Promise<void> => {
    try {
      setError(null);
      setLoading(true);
      await signInWithEmailAndPassword(auth, email, password);
      
      // Track sign in
      trackUserSignedIn({
        auth_method: 'email'
      });
    } catch (err) {
      handleAuthError(err);
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, displayName?: string): Promise<void> => {
    try {
      setError(null);
      setLoading(true);
      const { user: newUser } = await createUserWithEmailAndPassword(auth, email, password);
      
      if (displayName && newUser) {
        await updateProfile(newUser, { displayName });
      }

      // Track sign up
      trackUserSignedUp({
        auth_method: 'email'
      });
    } catch (err) {
      handleAuthError(err);
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async (): Promise<void> => {
    try {
      setError(null);
      setLoading(true);
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      // Check if this is a new user
      const isNewUser = result.user.metadata.creationTime === result.user.metadata.lastSignInTime;
      
      if (isNewUser) {
        trackUserSignedUp({
          auth_method: 'google'
        });
      } else {
        trackUserSignedIn({
          auth_method: 'google'
        });
      }
    } catch (err) {
      const error = err as { code?: string };
      if (error?.code !== 'auth/popup-closed-by-user') {
        handleAuthError(err);
      }
    } finally {
      setLoading(false);
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      setError(null);
      
      // Track sign out with session duration
      const sessionDuration = Math.floor((Date.now() - authStartTime) / 1000);
      trackUserSignedOut({
        session_duration_seconds: sessionDuration
      });
      
      await firebaseSignOut(auth);
    } catch (err) {
      handleAuthError(err);
    }
  };

  const resetPassword = async (email: string): Promise<void> => {
    try {
      setError(null);
      setLoading(true);
      await sendPasswordResetEmail(auth, email);
    } catch (err) {
      handleAuthError(err);
    } finally {
      setLoading(false);
    }
  };

  const clearError = (): void => {
    setError(null);
  };

  const contextValue: AuthContextType = {
    user,
    loading,
    error,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    resetPassword,
    clearError,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}