import { User as FirebaseUser } from 'firebase/auth';
import { UserProfile, UserPreferences } from '@/app/types/user';

export interface AuthUser extends FirebaseUser {
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}

export interface AuthContextType {
  user: AuthUser | null;
  profile: UserProfile | null;
  preferences: UserPreferences | null;
  loading: boolean;
  profileLoading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName?: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  clearError: () => void;
  // Profile management methods
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  updatePreferences: (updates: Partial<UserPreferences>) => Promise<void>;
  refreshProfile: () => Promise<void>;
  isProfileComplete: () => boolean;
}

export interface AuthProviderProps {
  children: React.ReactNode;
}

export interface SignInFormData {
  email: string;
  password: string;
}

export interface SignUpFormData {
  email: string;
  password: string;
  confirmPassword: string;
  displayName: string;
}

export type AuthState = 'loading' | 'authenticated' | 'unauthenticated';

export interface AuthError {
  code: string;
  message: string;
}

export type AuthModalMode = 'signin' | 'signup' | 'forgot-password';