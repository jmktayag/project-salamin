'use client';

import React, { useState } from 'react';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { SubmitButton, Button } from '../ui';

interface ForgotPasswordFormProps {
  onBackToSignIn?: () => void;
}

export default function ForgotPasswordForm({ onBackToSignIn }: ForgotPasswordFormProps) {
  const { resetPassword, loading, error, clearError } = useAuth();
  const [email, setEmail] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [emailError, setEmailError] = useState('');

  const validateEmail = (email: string): boolean => {
    if (!email) {
      setEmailError('Email is required');
      return false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError('Please enter a valid email');
      return false;
    }
    setEmailError('');
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateEmail(email)) return;

    try {
      await resetPassword(email);
      setEmailSent(true);
    } catch (err) {
      // Error is handled by AuthProvider
    }
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    if (emailError) setEmailError('');
    if (error) clearError();
  };

  if (emailSent) {
    return (
      <div className="w-full max-w-md mx-auto text-center">
        <div className="mb-6">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="gi-heading-2 mb-2">Check your email</h2>
          <p className="text-gray-600">
            We&apos;ve sent a password reset link to{' '}
            <span className="font-medium text-gray-900">{email}</span>
          </p>
        </div>

        <div className="space-y-4 text-sm text-gray-600">
          <p>
            Click the link in the email to reset your password. If you don&apos;t see the email, 
            check your spam folder.
          </p>
        </div>

        {onBackToSignIn && (
          <Button
            onClick={onBackToSignIn}
            variant="outline"
            size="md"
            fullWidth
            className="mt-6"
            icon={<ArrowLeft className="w-4 h-4" />}
          >
            Back to sign in
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-6">
        <h2 className="gi-heading-2">Forgot your password?</h2>
        <p className="text-gray-600 mt-2">
          Enter your email address and we&apos;ll send you a link to reset your password.
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3" style={{backgroundColor: 'var(--error-bg)', border: '1px solid var(--error-border)', borderRadius: '8px'}}>
          <p className="text-sm" style={{color: 'var(--error-text)'}}>{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email Address
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => handleEmailChange(e.target.value)}
              className={`w-full pl-10 pr-4 py-2 gi-input ${
                emailError ? 'error' : ''
              }`}
              placeholder="Enter your email address"
              disabled={loading}
            />
          </div>
          {emailError && (
            <p className="text-sm mt-1" style={{color: 'var(--error-text)'}}>{emailError}</p>
          )}
        </div>

        <SubmitButton
          isSubmitting={loading}
          submitText="Send Reset Link"
          submittingText="Sending..."
          fullWidth
          variant="primary"
          size="md"
        />
      </form>

      {onBackToSignIn && (
        <Button
          onClick={onBackToSignIn}
          variant="ghost"
          size="md"
          fullWidth
          className="mt-6"
          disabled={loading}
          icon={<ArrowLeft className="w-4 h-4" />}
        >
          Back to sign in
        </Button>
      )}
    </div>
  );
}