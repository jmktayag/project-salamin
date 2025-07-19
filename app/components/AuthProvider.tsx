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
import { profileService } from '../utils/ProfileService';
import { UserProfile, UserPreferences, isCompleteProfile } from '../types/user';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authStartTime] = useState(Date.now());

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: User | null) => {
      if (firebaseUser) {
        const authUser = {
          ...firebaseUser,
          displayName: firebaseUser.displayName,
          email: firebaseUser.email,
          photoURL: firebaseUser.photoURL,
        } as AuthUser;
        
        setUser(authUser);
        
        // Load user profile and preferences
        await loadUserProfile(firebaseUser.uid);
        
        // Update last login timestamp
        try {
          await profileService.updateLastLogin(firebaseUser.uid);
        } catch (error) {
          console.error('Error updating last login:', error);
        }
      } else {
        setUser(null);
        setProfile(null);
        setPreferences(null);
        profileService.clearAllCache();
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Helper function to load user profile and preferences
  const loadUserProfile = async (uid: string) => {
    try {
      setProfileLoading(true);
      
      // Load profile and preferences in parallel
      const [userProfile, userPreferences] = await Promise.all([
        profileService.getProfile(uid),
        profileService.getUserPreferences(uid)
      ]);
      
      setProfile(userProfile);
      setPreferences(userPreferences);
    } catch (error) {
      console.error('Error loading user profile:', error);
      setError('Failed to load user profile');
    } finally {
      setProfileLoading(false);
    }
  };

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

      // Create user profile
      if (newUser) {
        try {
          await profileService.createProfile(newUser.uid, {
            email: newUser.email || email,
            displayName: displayName || newUser.displayName || '',
            photoURL: newUser.photoURL || undefined
          });
        } catch (profileError) {
          console.error('Error creating user profile:', profileError);
          // Don't throw error for profile creation failure
        }
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
        // Create profile for new Google users
        try {
          await profileService.createProfile(result.user.uid, {
            email: result.user.email || '',
            displayName: result.user.displayName || '',
            photoURL: result.user.photoURL || undefined
          });
        } catch (profileError) {
          console.error('Error creating Google user profile:', profileError);
        }
        
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

  // Profile management methods
  const updateUserProfile = async (updates: Partial<UserProfile>): Promise<void> => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      setProfileLoading(true);
      await profileService.updateProfile(user.uid, updates);
      
      // Refresh profile data
      const updatedProfile = await profileService.getProfile(user.uid);
      setProfile(updatedProfile);
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('Failed to update profile');
      throw error;
    } finally {
      setProfileLoading(false);
    }
  };

  const updateUserPreferences = async (updates: Partial<UserPreferences>): Promise<void> => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      await profileService.updateUserPreferences(user.uid, updates);
      
      // Refresh preferences data
      const updatedPreferences = await profileService.getUserPreferences(user.uid);
      setPreferences(updatedPreferences);
    } catch (error) {
      console.error('Error updating preferences:', error);
      setError('Failed to update preferences');
      throw error;
    }
  };

  const refreshProfile = async (): Promise<void> => {
    if (!user) return;
    
    // Clear cache and reload profile
    profileService.clearCache(user.uid);
    await loadUserProfile(user.uid);
  };

  const checkProfileComplete = (): boolean => {
    return profile ? isCompleteProfile(profile) : false;
  };

  const contextValue: AuthContextType = {
    user,
    profile,
    preferences,
    loading,
    profileLoading,
    error,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    resetPassword,
    clearError,
    updateProfile: updateUserProfile,
    updatePreferences: updateUserPreferences,
    refreshProfile,
    isProfileComplete: checkProfileComplete,
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