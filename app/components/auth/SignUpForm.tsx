'use client';

import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, User } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { SignUpFormData } from '../../lib/firebase/auth-types';
import { SubmitButton, IconButton, Button } from '../ui';

interface SignUpFormProps {
  onSuccess?: () => void;
  onSwitchToSignIn?: () => void;
}

export default function SignUpForm({ onSuccess, onSwitchToSignIn }: SignUpFormProps) {
  const { signUp, signInWithGoogle, loading, error, clearError } = useAuth();
  const [formData, setFormData] = useState<SignUpFormData>({
    email: '',
    password: '',
    confirmPassword: '',
    displayName: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formErrors, setFormErrors] = useState<Partial<SignUpFormData>>({});

  const validateForm = (): boolean => {
    const errors: Partial<SignUpFormData> = {};

    if (!formData.displayName.trim()) {
      errors.displayName = 'Name is required';
    }

    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Please enter a valid email';
    }

    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      await signUp(formData.email, formData.password, formData.displayName);
      onSuccess?.();
    } catch (err) {
      // Error is handled by AuthProvider
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
      onSuccess?.();
    } catch (err) {
      // Error is handled by AuthProvider
    }
  };

  const handleInputChange = (field: keyof SignUpFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
    if (error) clearError();
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-6">
        <h2 className="gi-heading-2">Create your account</h2>
        <p className="text-gray-600 mt-2">Sign up to start practicing interviews</p>
      </div>

      {error && (
        <div className="mb-4 p-3" style={{backgroundColor: 'var(--error-bg)', border: '1px solid var(--error-border)', borderRadius: '8px'}}>
          <p className="text-sm" style={{color: 'var(--error-text)'}}>{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-1">
            Full Name
          </label>
          <div className="relative">
            <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              type="text"
              id="displayName"
              value={formData.displayName}
              onChange={(e) => handleInputChange('displayName', e.target.value)}
              className={`w-full pl-10 pr-4 py-2 gi-input ${
                formErrors.displayName ? 'error' : ''
              }`}
              placeholder="Enter your full name"
              disabled={loading}
            />
          </div>
          {formErrors.displayName && (
            <p className="text-sm mt-1" style={{color: 'var(--error-text)'}}>{formErrors.displayName}</p>
          )}
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className={`w-full pl-10 pr-4 py-2 gi-input ${
                formErrors.email ? 'error' : ''
              }`}
              placeholder="Enter your email"
              disabled={loading}
            />
          </div>
          {formErrors.email && (
            <p className="text-sm mt-1" style={{color: 'var(--error-text)'}}>{formErrors.email}</p>
          )}
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              className={`w-full pl-10 pr-12 py-2 gi-input ${
                formErrors.password ? 'error' : ''
              }`}
              placeholder="Create a password"
              disabled={loading}
            />
            <IconButton
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3"
              variant="ghost"
              size="xs"
              disabled={loading}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </IconButton>
          </div>
          {formErrors.password && (
            <p className="text-sm mt-1" style={{color: 'var(--error-text)'}}>{formErrors.password}</p>
          )}
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
            Confirm Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              id="confirmPassword"
              value={formData.confirmPassword}
              onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
              className={`w-full pl-10 pr-12 py-2 gi-input ${
                formErrors.confirmPassword ? 'error' : ''
              }`}
              placeholder="Confirm your password"
              disabled={loading}
            />
            <IconButton
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-3"
              variant="ghost"
              size="xs"
              disabled={loading}
              aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
            >
              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </IconButton>
          </div>
          {formErrors.confirmPassword && (
            <p className="text-sm mt-1" style={{color: 'var(--error-text)'}}>{formErrors.confirmPassword}</p>
          )}
        </div>

        <SubmitButton
          isSubmitting={loading}
          submitText="Create Account"
          submittingText="Creating account..."
          fullWidth
          variant="primary"
          size="md"
        />
      </form>

      <div className="mt-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Or continue with</span>
          </div>
        </div>

        <Button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          variant="outline"
          size="md"
          fullWidth
          className="mt-3"
          icon={
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
          }
        >
          Continue with Google
        </Button>
      </div>

      {onSwitchToSignIn && (
        <div className="mt-6 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Button
            type="button"
            onClick={onSwitchToSignIn}
            variant="ghost" 
            size="sm"
            disabled={loading}
            className="text-blue-600 hover:text-blue-700 font-medium p-1"
          >
            Sign in
          </Button>
        </div>
      )}
    </div>
  );
}