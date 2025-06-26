'use client';

import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { AuthModalMode } from '../../lib/firebase/auth-types';
import SignInForm from './SignInForm';
import SignUpForm from './SignUpForm';
import ForgotPasswordForm from './ForgotPasswordForm';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: AuthModalMode;
  onModeChange: (mode: AuthModalMode) => void;
}

export default function AuthModal({ isOpen, onClose, mode, onModeChange }: AuthModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleSuccess = () => {
    onClose();
  };

  const switchToSignUp = () => {
    onModeChange('signup');
  };

  const switchToSignIn = () => {
    onModeChange('signin');
  };

  const switchToForgotPassword = () => {
    onModeChange('forgot-password');
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="relative w-full max-w-md mx-4 gi-card-lg max-h-[90vh] overflow-y-auto">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal content */}
        <div className="p-6 pt-12">
          {mode === 'signin' ? (
            <SignInForm 
              onSuccess={handleSuccess}
              onSwitchToSignUp={switchToSignUp}
              onSwitchToForgotPassword={switchToForgotPassword}
            />
          ) : mode === 'signup' ? (
            <SignUpForm 
              onSuccess={handleSuccess}
              onSwitchToSignIn={switchToSignIn}
            />
          ) : (
            <ForgotPasswordForm 
              onBackToSignIn={switchToSignIn}
            />
          )}
        </div>
      </div>
    </div>
  );
}