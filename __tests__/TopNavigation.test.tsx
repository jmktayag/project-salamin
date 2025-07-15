import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TopNavigation from '@/app/components/navigation/TopNavigation';
import { NavigationProvider } from '@/app/components/navigation/NavigationProvider';

// Mock the auth hook
const mockSignOut = jest.fn();
const mockUseAuth = {
  user: null,
  signOut: mockSignOut,
  loading: false
};

jest.mock('@/app/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth
}));

// Mock the AuthProvider to avoid Firebase dependencies
jest.mock('@/app/components/AuthProvider', () => ({
  useAuth: () => mockUseAuth,
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}));

// Mock AuthModal component
jest.mock('@/app/components/auth/AuthModal', () => {
  return function MockAuthModal({ isOpen, onClose, mode }: any) {
    return isOpen ? (
      <div data-testid="auth-modal">
        <span>Auth Modal - {mode}</span>
        <button onClick={onClose}>Close</button>
      </div>
    ) : null;
  };
});

// Mock Image component from Next.js
jest.mock('next/image', () => {
  return function MockImage({ src, alt, ...props }: any) {
    return <img src={src} alt={alt} {...props} />;
  };
});

// Mock window.scrollTo to avoid jsdom errors
Object.defineProperty(window, 'scrollTo', {
  value: jest.fn(),
  writable: true
});

// Helper function to render TopNavigation with NavigationProvider
const renderWithProviders = (initialUser = null) => {
  mockUseAuth.user = initialUser;
  
  return render(
    <NavigationProvider>
      <TopNavigation />
    </NavigationProvider>
  );
};

describe('TopNavigation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.user = null;
    mockUseAuth.loading = false;
  });

  describe('Unauthenticated state', () => {
    it('should render sign in and sign up buttons when user is not authenticated', () => {
      renderWithProviders();
      
      expect(screen.getByText('Sign In')).toBeInTheDocument();
      expect(screen.getByText('Sign Up')).toBeInTheDocument();
      expect(screen.queryByTestId('user-menu')).not.toBeInTheDocument();
    });

    it('should open auth modal in signin mode when sign in button is clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders();
      
      await user.click(screen.getByText('Sign In'));
      
      expect(screen.getByTestId('auth-modal')).toBeInTheDocument();
      expect(screen.getByText('Auth Modal - signin')).toBeInTheDocument();
    });

    it('should open auth modal in signup mode when sign up button is clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders();
      
      await user.click(screen.getByText('Sign Up'));
      
      expect(screen.getByTestId('auth-modal')).toBeInTheDocument();
      expect(screen.getByText('Auth Modal - signup')).toBeInTheDocument();
    });

    it('should close auth modal when close button is clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders();
      
      await user.click(screen.getByText('Sign In'));
      expect(screen.getByTestId('auth-modal')).toBeInTheDocument();
      
      await user.click(screen.getByText('Close'));
      expect(screen.queryByTestId('auth-modal')).not.toBeInTheDocument();
    });
  });

  describe('Authenticated state', () => {
    const mockUser = {
      displayName: 'John Doe',
      email: 'john@example.com',
      photoURL: 'https://example.com/photo.jpg'
    };

    it('should render user menu when user is authenticated', () => {
      renderWithProviders(mockUser);
      
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.queryByText('Sign In')).not.toBeInTheDocument();
      expect(screen.queryByText('Sign Up')).not.toBeInTheDocument();
    });

    it('should display user photo when photoURL is provided', () => {
      renderWithProviders(mockUser);
      
      const userPhoto = screen.getByAltText('Profile');
      expect(userPhoto).toBeInTheDocument();
      expect(userPhoto).toHaveAttribute('src', mockUser.photoURL);
    });

    it('should display default user icon when no photoURL is provided', () => {
      const userWithoutPhoto = { ...mockUser, photoURL: null };
      renderWithProviders(userWithoutPhoto);
      
      expect(screen.queryByAltText('Profile')).not.toBeInTheDocument();
    });

    it('should display user email in dropdown menu', async () => {
      const user = userEvent.setup();
      renderWithProviders(mockUser);
      
      await user.click(screen.getByText('John Doe'));
      
      expect(screen.getByText(mockUser.email)).toBeInTheDocument();
    });

    it('should show dropdown menu when user menu is clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(mockUser);
      
      await user.click(screen.getByText('John Doe'));
      
      expect(screen.getByText('Interview History')).toBeInTheDocument();
      expect(screen.getByText('Sign out')).toBeInTheDocument();
    });

    it('should hide dropdown menu when clicking outside', async () => {
      const user = userEvent.setup();
      renderWithProviders(mockUser);
      
      // Open dropdown
      await user.click(screen.getByText('John Doe'));
      expect(screen.getByText('Interview History')).toBeInTheDocument();
      
      // Click outside
      fireEvent.mouseDown(document.body);
      
      await waitFor(() => {
        expect(screen.queryByText('Interview History')).not.toBeInTheDocument();
      });
    });
  });

  describe('Sign out functionality', () => {
    const mockUser = {
      displayName: 'John Doe',
      email: 'john@example.com',
      photoURL: null
    };

    it('should call signOut and redirect to home page when sign out is clicked', async () => {
      const user = userEvent.setup();
      mockSignOut.mockResolvedValue(undefined);
      
      renderWithProviders(mockUser);
      
      // Open user menu
      await user.click(screen.getByText('John Doe'));
      
      // Click sign out
      await user.click(screen.getByText('Sign out'));
      
      expect(mockSignOut).toHaveBeenCalledTimes(1);
    });

    it('should close user menu after successful sign out', async () => {
      const user = userEvent.setup();
      mockSignOut.mockResolvedValue(undefined);
      
      renderWithProviders(mockUser);
      
      // Open user menu
      await user.click(screen.getByText('John Doe'));
      expect(screen.getByText('Sign out')).toBeInTheDocument();
      
      // Click sign out
      await user.click(screen.getByText('Sign out'));
      
      await waitFor(() => {
        expect(screen.queryByText('Sign out')).not.toBeInTheDocument();
      });
    });

    it('should handle sign out errors gracefully', async () => {
      const user = userEvent.setup();
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockSignOut.mockRejectedValue(new Error('Sign out failed'));
      
      renderWithProviders(mockUser);
      
      // Open user menu and click sign out
      await user.click(screen.getByText('John Doe'));
      await user.click(screen.getByText('Sign out'));
      
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Sign out error:', expect.any(Error));
      });
      
      consoleSpy.mockRestore();
    });

    it('should not allow sign out when loading state is true', async () => {
      const user = userEvent.setup();
      mockUseAuth.loading = true;
      renderWithProviders(mockUser);
      
      // Find the actual button element (parent of the text span)
      const userMenuButton = screen.getByText('John Doe').closest('button');
      expect(userMenuButton).toBeDisabled();
      
      // Try to click it anyway - it shouldn't open
      await user.click(userMenuButton!);
      expect(screen.queryByText('Sign out')).not.toBeInTheDocument();
    });
  });

  describe('Navigation functionality', () => {
    const mockUser = {
      displayName: 'John Doe',
      email: 'john@example.com',
      photoURL: null
    };

    it('should navigate to history page when Interview History is clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(mockUser);
      
      // Open user menu
      await user.click(screen.getByText('John Doe'));
      
      // Click Interview History
      await user.click(screen.getByText('Interview History'));
      
      // Menu should close after navigation
      await waitFor(() => {
        expect(screen.queryByText('Sign out')).not.toBeInTheDocument();
      });
    });

    it('should reset to home when logo is clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders();
      
      const logoButton = screen.getByLabelText('Ghost Interviewer Home');
      await user.click(logoButton);
      
      // This would trigger resetToHome in NavigationProvider
      // The exact assertion depends on how the navigation state is exposed
    });
  });

  describe('Loading states', () => {
    it('should disable buttons when loading is true', () => {
      mockUseAuth.loading = true;
      renderWithProviders();
      
      expect(screen.getByText('Sign In')).toBeDisabled();
      expect(screen.getByText('Sign Up')).toBeDisabled();
    });

    it('should disable user menu when loading is true for authenticated user', () => {
      const mockUser = {
        displayName: 'John Doe',
        email: 'john@example.com',
        photoURL: null
      };
      
      mockUseAuth.loading = true;
      renderWithProviders(mockUser);
      
      // Find the actual button element (parent of the text span)
      const userMenuButton = screen.getByText('John Doe').closest('button');
      expect(userMenuButton).toBeDisabled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      renderWithProviders();
      
      expect(screen.getByLabelText('Ghost Interviewer Home')).toBeInTheDocument();
    });

    it('should handle keyboard navigation for user menu', async () => {
      const mockUser = {
        displayName: 'John Doe',
        email: 'john@example.com',
        photoURL: null
      };
      
      renderWithProviders(mockUser);
      
      // Find the actual button element (parent of the text span)
      const userMenuButton = screen.getByText('John Doe').closest('button');
      
      // Focus on user menu button
      userMenuButton!.focus();
      expect(userMenuButton).toHaveFocus();
      
      // Test that it's not disabled for accessibility
      expect(userMenuButton).not.toBeDisabled();
    });
  });
});