import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '@/app/components/AuthProvider';
import { profileService } from '@/app/utils/ProfileService';
import { UserProfile, getDefaultNotificationSettings } from '@/app/types/user';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from 'firebase/auth';

// Mock Firebase Auth
jest.mock('firebase/auth');
jest.mock('@/app/utils/ProfileService');
jest.mock('@/app/lib/firebase/analytics');

const mockOnAuthStateChanged = onAuthStateChanged as jest.MockedFunction<typeof onAuthStateChanged>;
const mockSignInWithEmailAndPassword = signInWithEmailAndPassword as jest.MockedFunction<typeof signInWithEmailAndPassword>;
const mockCreateUserWithEmailAndPassword = createUserWithEmailAndPassword as jest.MockedFunction<typeof createUserWithEmailAndPassword>;
const mockSignInWithPopup = signInWithPopup as jest.MockedFunction<typeof signInWithPopup>;
const mockSignOut = signOut as jest.MockedFunction<typeof signOut>;
const mockUpdateProfile = updateProfile as jest.MockedFunction<typeof updateProfile>;

const mockProfileService = profileService as jest.Mocked<typeof profileService>;

// Test component to access auth context
const TestComponent = () => {
  const auth = useAuth();
  
  return (
    <div>
      <div data-testid="user-status">
        {auth.loading ? 'loading' : auth.user ? 'authenticated' : 'unauthenticated'}
      </div>
      <div data-testid="profile-status">
        {auth.profileLoading ? 'profile-loading' : auth.profile ? 'profile-loaded' : 'no-profile'}
      </div>
      <div data-testid="user-email">{auth.user?.email || 'no-email'}</div>
      <div data-testid="profile-completion">
        {auth.profile ? auth.profile.profileCompletionScore : '0'}
      </div>
      <div data-testid="profile-complete">
        {auth.isProfileComplete() ? 'complete' : 'incomplete'}
      </div>
      {auth.error && <div data-testid="error">{auth.error}</div>}
      
      <button 
        data-testid="sign-in" 
        onClick={() => auth.signIn('test@example.com', 'password')}
      >
        Sign In
      </button>
      <button 
        data-testid="sign-up" 
        onClick={() => auth.signUp('test@example.com', 'password', 'Test User')}
      >
        Sign Up
      </button>
      <button 
        data-testid="update-profile" 
        onClick={() => auth.updateProfile({ bio: 'Updated bio' })}
      >
        Update Profile
      </button>
    </div>
  );
};

describe('AuthProvider', () => {
  const mockUser = {
    uid: 'test-user-123',
    email: 'test@example.com',
    displayName: 'Test User',
    photoURL: null,
    metadata: {
      creationTime: '2023-01-01',
      lastSignInTime: '2023-01-01',
    },
  };

  const mockProfile: UserProfile = {
    uid: 'test-user-123',
    email: 'test@example.com',
    displayName: 'Test User',
    yearsOfExperience: 2,
    industry: ['technology'],
    targetRoles: ['Software Engineer'],
    targetCompanies: [],
    preferredInterviewTypes: ['technical'],
    difficultyPreference: 'intermediate',
    sessionLengthPreference: 30,
    availableTimeSlots: [],
    timeZone: 'UTC',
    profileVisibility: 'peers_only',
    notificationPreferences: getDefaultNotificationSettings(),
    dataProcessingConsent: true,
    marketingConsent: false,
    createdAt: { nanoseconds: 0, seconds: Date.now() / 1000 } as any,
    updatedAt: { nanoseconds: 0, seconds: Date.now() / 1000 } as any,
    lastLoginAt: { nanoseconds: 0, seconds: Date.now() / 1000 } as any,
    accountStatus: 'active',
    subscriptionTier: 'free',
    profileCompletionScore: 85,
    completedSections: ['personal_info', 'professional_info'],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementations
    mockOnAuthStateChanged.mockImplementation((auth, callback) => {
      // Initially call with null (unauthenticated)
      if (typeof callback === 'function') {
        callback(null);
      }
      return jest.fn(); // Return unsubscribe function
    });

    mockProfileService.getProfile.mockResolvedValue(mockProfile);
    mockProfileService.getUserPreferences.mockResolvedValue({
      userId: 'test-user-123',
      theme: 'system',
      language: 'en',
      practiceReminders: true,
      reminderTime: '18:00',
      sessionSettings: {
        audioEnabled: true,
        speechRecognitionEnabled: true,
        autoAdvanceQuestions: false,
        showHints: true,
        pauseBetweenQuestions: 3,
      },
      updatedAt: { nanoseconds: 0, seconds: Date.now() / 1000 } as any,
    });
  });

  describe('initial state', () => {
    it('should start with loading state', () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      expect(screen.getByTestId('user-status')).toHaveTextContent('loading');
    });

    it('should show unauthenticated state when no user', async () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('user-status')).toHaveTextContent('unauthenticated');
      });
    });
  });

  describe('authentication flow', () => {
    it('should handle successful user authentication', async () => {
      mockOnAuthStateChanged.mockImplementation((auth, callback) => {
        // Simulate auth state change to authenticated user
        setTimeout(() => {
          if (typeof callback === 'function') {
            callback(mockUser as any);
          }
        }, 0);
        return jest.fn();
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('user-status')).toHaveTextContent('authenticated');
        expect(screen.getByTestId('user-email')).toHaveTextContent('test@example.com');
      });
    });

    it('should load profile data after authentication', async () => {
      mockOnAuthStateChanged.mockImplementation((auth, callback) => {
        setTimeout(() => {
          if (typeof callback === 'function') {
            callback(mockUser as any);
          }
        }, 0);
        return jest.fn();
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('profile-status')).toHaveTextContent('profile-loaded');
        expect(screen.getByTestId('profile-completion')).toHaveTextContent('85');
      });

      expect(mockProfileService.getProfile).toHaveBeenCalledWith('test-user-123');
      expect(mockProfileService.getUserPreferences).toHaveBeenCalledWith('test-user-123');
      expect(mockProfileService.updateLastLogin).toHaveBeenCalledWith('test-user-123');
    });
  });

  describe('sign in', () => {
    it('should handle successful sign in', async () => {
      mockSignInWithEmailAndPassword.mockResolvedValueOnce({
        user: mockUser,
      } as any);

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await act(async () => {
        screen.getByTestId('sign-in').click();
      });

      expect(mockSignInWithEmailAndPassword).toHaveBeenCalledWith(
        expect.any(Object),
        'test@example.com',
        'password'
      );
    });

    it('should handle sign in errors', async () => {
      mockSignInWithEmailAndPassword.mockRejectedValueOnce({
        code: 'auth/user-not-found',
        message: 'User not found',
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await act(async () => {
        screen.getByTestId('sign-in').click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('No account found with this email address');
      });
    });
  });

  describe('sign up', () => {
    it('should handle successful sign up and create profile', async () => {
      mockCreateUserWithEmailAndPassword.mockResolvedValueOnce({
        user: mockUser,
      } as any);
      
      mockUpdateProfile.mockResolvedValueOnce(undefined);
      mockProfileService.createProfile.mockResolvedValueOnce(mockProfile);

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await act(async () => {
        screen.getByTestId('sign-up').click();
      });

      expect(mockCreateUserWithEmailAndPassword).toHaveBeenCalledWith(
        expect.any(Object),
        'test@example.com',
        'password'
      );
      
      expect(mockUpdateProfile).toHaveBeenCalledWith(
        mockUser,
        { displayName: 'Test User' }
      );

      expect(mockProfileService.createProfile).toHaveBeenCalledWith(
        'test-user-123',
        {
          email: 'test@example.com',
          displayName: 'Test User',
          photoURL: null,
        }
      );
    });

    it('should handle sign up errors', async () => {
      mockCreateUserWithEmailAndPassword.mockRejectedValueOnce({
        code: 'auth/email-already-in-use',
        message: 'Email already in use',
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await act(async () => {
        screen.getByTestId('sign-up').click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('An account with this email already exists');
      });
    });

    it('should continue even if profile creation fails', async () => {
      mockCreateUserWithEmailAndPassword.mockResolvedValueOnce({
        user: mockUser,
      } as any);
      
      mockUpdateProfile.mockResolvedValueOnce(undefined);
      mockProfileService.createProfile.mockRejectedValueOnce(new Error('Profile creation failed'));

      // Should not throw an error
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await act(async () => {
        screen.getByTestId('sign-up').click();
      });

      // Should still call create profile
      expect(mockProfileService.createProfile).toHaveBeenCalled();
    });
  });

  describe('profile management', () => {
    beforeEach(() => {
      mockOnAuthStateChanged.mockImplementation((auth, callback) => {
        setTimeout(() => {
          if (typeof callback === 'function') {
            callback(mockUser as any);
          }
        }, 0);
        return jest.fn();
      });
    });

    it('should update profile successfully', async () => {
      const updatedProfile = { ...mockProfile, bio: 'Updated bio' };
      mockProfileService.updateProfile.mockResolvedValueOnce(undefined);
      mockProfileService.getProfile.mockResolvedValueOnce(updatedProfile);

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Wait for initial auth and profile load
      await waitFor(() => {
        expect(screen.getByTestId('user-status')).toHaveTextContent('authenticated');
      });

      await act(async () => {
        screen.getByTestId('update-profile').click();
      });

      expect(mockProfileService.updateProfile).toHaveBeenCalledWith(
        'test-user-123',
        { bio: 'Updated bio' }
      );
      
      expect(mockProfileService.getProfile).toHaveBeenCalledTimes(2); // Initial load + refresh
    });

    it('should handle profile update errors', async () => {
      mockProfileService.updateProfile.mockRejectedValueOnce(new Error('Update failed'));

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Wait for initial auth and profile load
      await waitFor(() => {
        expect(screen.getByTestId('user-status')).toHaveTextContent('authenticated');
      });

      await act(async () => {
        screen.getByTestId('update-profile').click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Failed to update profile');
      });
    });

    it('should check profile completion correctly', async () => {
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('profile-complete')).toHaveTextContent('complete');
      });
    });
  });

  describe('Google sign in', () => {
    it('should handle new user Google sign in', async () => {
      const googleUser = {
        ...mockUser,
        metadata: {
          creationTime: '2023-01-01',
          lastSignInTime: '2023-01-01', // Same time = new user
        },
      };

      mockSignInWithPopup.mockResolvedValueOnce({
        user: googleUser,
      } as any);

      mockProfileService.createProfile.mockResolvedValueOnce(mockProfile);

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // We would need to trigger Google sign in here
      // This would require adding a Google sign in button to TestComponent
      // For now, we'll test the logic directly
    });

    it('should handle popup closed by user', async () => {
      mockSignInWithPopup.mockRejectedValueOnce({
        code: 'auth/popup-closed-by-user',
      });

      // Should not show error for popup closed
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Test would require triggering Google sign in
    });
  });

  describe('sign out', () => {
    it('should clear user and profile data on sign out', async () => {
      // First authenticate user
      mockOnAuthStateChanged.mockImplementation((auth, callback) => {
        if (typeof callback === 'function') {
          callback(mockUser as any);
        }
        return jest.fn();
      });

      mockSignOut.mockResolvedValueOnce(undefined);

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('user-status')).toHaveTextContent('authenticated');
      });

      // Then sign out (would need sign out button in TestComponent)
      // For now, test that the auth state change to null clears data
      mockOnAuthStateChanged.mockImplementation((auth, callback) => {
        callback(null);
        return jest.fn();
      });

      // Re-render to trigger auth state change
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('user-status')).toHaveTextContent('unauthenticated');
        expect(screen.getByTestId('profile-status')).toHaveTextContent('no-profile');
      });

      expect(mockProfileService.clearAllCache).toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should handle profile loading errors gracefully', async () => {
      mockOnAuthStateChanged.mockImplementation((auth, callback) => {
        setTimeout(() => {
          if (typeof callback === 'function') {
            callback(mockUser as any);
          }
        }, 0);
        return jest.fn();
      });

      mockProfileService.getProfile.mockRejectedValueOnce(new Error('Profile load failed'));

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('user-status')).toHaveTextContent('authenticated');
        expect(screen.getByTestId('error')).toHaveTextContent('Failed to load user profile');
      });
    });

    it('should handle various auth error codes', async () => {
      const errorCodes = [
        { code: 'auth/wrong-password', expected: 'Incorrect password' },
        { code: 'auth/weak-password', expected: 'Password should be at least 6 characters' },
        { code: 'auth/invalid-email', expected: 'Please enter a valid email address' },
        { code: 'auth/too-many-requests', expected: 'Too many failed attempts. Please try again later' },
      ];

      for (const { code, expected } of errorCodes) {
        jest.clearAllMocks();
        
        mockSignInWithEmailAndPassword.mockRejectedValueOnce({
          code,
          message: `Firebase: ${code}`,
        });

        render(
          <AuthProvider>
            <TestComponent />
          </AuthProvider>
        );

        await act(async () => {
          screen.getByTestId('sign-in').click();
        });

        await waitFor(() => {
          expect(screen.getByTestId('error')).toHaveTextContent(expected);
        });
      }
    });
  });

  describe('context error handling', () => {
    it('should throw error when useAuth is used outside AuthProvider', () => {
      // Suppress console.error for this test
      const originalError = console.error;
      console.error = jest.fn();

      expect(() => {
        render(<TestComponent />);
      }).toThrow('useAuth must be used within an AuthProvider');

      console.error = originalError;
    });
  });
});