import { User as FirebaseUser } from 'firebase/auth';

export interface AuthUser extends FirebaseUser {
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}

export interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName?: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  clearError: () => void;
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