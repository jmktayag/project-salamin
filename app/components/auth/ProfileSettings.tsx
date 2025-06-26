'use client';

import React, { useState } from 'react';
import { User, Mail, Save, AlertCircle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { updateProfile, updatePassword } from 'firebase/auth';
import { auth } from '../../lib/firebase/config';

interface ProfileSettingsProps {
  onClose?: () => void;
}

export default function ProfileSettings({ onClose }: ProfileSettingsProps) {
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !auth.currentUser) return;

    try {
      setError(null);
      setLoading(true);

      await updateProfile(auth.currentUser, {
        displayName: displayName.trim()
      });

      setSuccess('Profile updated successfully');
    } catch (err) {
      const error = err as { message?: string };
      setError(error?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !auth.currentUser) return;

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters');
      return;
    }

    try {
      setError(null);
      setLoading(true);

      await updatePassword(auth.currentUser, newPassword);
      
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setSuccess('Password updated successfully');
    } catch (err) {
      const error = err as { message?: string };
      setError(error?.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 gi-card">
      <div className="flex items-center justify-between mb-6">
        <h2 className="gi-heading-2">Profile Settings</h2>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 flex items-center" style={{backgroundColor: 'var(--error-bg)', border: '1px solid var(--error-border)', borderRadius: '8px'}}>
          <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
          <p className="text-sm" style={{color: 'var(--error-text)'}}>{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-4 p-3" style={{backgroundColor: 'var(--success-bg)', border: '1px solid var(--success-border)', borderRadius: '8px'}}>
          <p className="text-sm" style={{color: 'var(--success-text)'}}>{success}</p>
        </div>
      )}

      <div className="space-y-8">
        {/* Profile Information */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Profile Information</h3>
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  id="email"
                  value={user.email || ''}
                  className="w-full pl-10 pr-4 py-2 gi-input"
                  disabled
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Email cannot be changed
              </p>
            </div>

            <div>
              <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-1">
                Display Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 gi-input"
                  placeholder="Enter your display name"
                  disabled={loading}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || displayName === (user.displayName || '')}
              className="flex items-center px-4 py-2 gi-btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4 mr-2" />
              {loading ? 'Updating...' : 'Update Profile'}
            </button>
          </form>
        </div>

        {/* Password Change */}
        {!user.photoURL?.includes('googleusercontent.com') && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Change Password</h3>
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  id="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-2 gi-input"
                  placeholder="Enter new password"
                  disabled={loading}
                />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2 gi-input"
                  placeholder="Confirm new password"
                  disabled={loading}
                />
              </div>

              <button
                type="submit"
                disabled={loading || !newPassword || !confirmPassword}
                className="flex items-center px-4 py-2 gi-btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4 mr-2" />
                {loading ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}