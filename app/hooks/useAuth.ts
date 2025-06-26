import { useAuth as useAuthContext } from '../components/AuthProvider';
import { AuthState } from '../lib/firebase/auth-types';

export function useAuth() {
  return useAuthContext();
}

export function useAuthState(): AuthState {
  const { user, loading } = useAuth();
  
  if (loading) return 'loading';
  if (user) return 'authenticated';
  return 'unauthenticated';
}

export function useRequireAuth() {
  const { user, loading } = useAuth();
  
  return {
    user,
    loading,
    isAuthenticated: !!user && !loading,
    isUnauthenticated: !user && !loading,
  };
}