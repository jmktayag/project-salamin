'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Save, CheckCircle, AlertCircle, User, Briefcase, Settings, Shield, Bell } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { ProfileService } from '../utils/ProfileService';
import { 
  UserProfile, 
  UserPreferences,
  calculateProfileCompletionScore,
  INDUSTRY_OPTIONS,
  JOB_POSITIONS,
  COMPANY_OPTIONS
} from '../types/user';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { TextArea } from './ui/TextArea';

interface ProfileSectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  isExpanded: boolean;
  onToggle: () => void;
}

function ProfileSection({ title, icon, children, isExpanded, onToggle }: ProfileSectionProps) {
  return (
    <Card className="mb-6">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center space-x-3">
          {icon}
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>
        <ChevronDownIcon className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
      </button>
      {isExpanded && (
        <div className="px-6 pb-6 border-t border-gray-100">
          {children}
        </div>
      )}
    </Card>
  );
}

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );
}

export default function ProfilePage() {
  const { user, profile, updateProfile, isProfileComplete } = useAuth();
  const [editedProfile, setEditedProfile] = useState<Partial<UserProfile>>({});
  const [editedPreferences, setEditedPreferences] = useState<Partial<UserPreferences>>({});
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    personal: true,
    professional: false,
    preferences: false,
    privacy: false,
    notifications: false
  });
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [autoSaving, setAutoSaving] = useState(false);
  const [lastAutoSave, setLastAutoSave] = useState<Date | null>(null);

  useEffect(() => {
    if (profile) {
      setEditedProfile(profile);
    }
  }, [profile]);

  const profileService = ProfileService.getInstance();

  useEffect(() => {
    async function loadPreferences() {
      if (user) {
        try {
          const prefs = await profileService.getUserPreferences(user.uid);
          if (prefs) {
            setEditedPreferences(prefs);
          }
        } catch (error) {
          console.error('Failed to load preferences:', error);
        }
      }
    }
    loadPreferences();
  }, [user]);

  const completionScore = editedProfile ? calculateProfileCompletionScore(editedProfile) : 0;

  const handleProfileChange = useCallback((field: keyof UserProfile, value: any) => {
    setEditedProfile(prev => ({ ...prev, [field]: value }));
  }, []);


  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    setSaveMessage(null);

    try {
      // Save profile updates
      if (Object.keys(editedProfile).length > 0) {
        await updateProfile(editedProfile);
      }

      // Save preferences updates
      if (Object.keys(editedPreferences).length > 0) {
        await profileService.updateUserPreferences(user.uid, editedPreferences);
      }

      setSaveMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (error) {
      console.error('Save error:', error);
      setSaveMessage({ type: 'error', text: 'Failed to save profile. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  // Debounce utility function
  const debounce = (func: (...args: any[]) => void, delay: number) => {
    let timeoutId: NodeJS.Timeout;
    return (...args: any[]) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  };

  // Auto-save function
  const autoSave = useCallback(async () => {
    if (!user || saving || autoSaving) return;
    
    const hasProfileChanges = Object.keys(editedProfile).length > 0;
    const hasPreferencesChanges = Object.keys(editedPreferences).length > 0;
    
    if (!hasProfileChanges && !hasPreferencesChanges) return;

    try {
      setAutoSaving(true);
      
      // Save profile updates
      if (hasProfileChanges) {
        await updateProfile(editedProfile);
      }

      // Save preferences updates
      if (hasPreferencesChanges) {
        await profileService.updateUserPreferences(user.uid, editedPreferences);
      }

      setLastAutoSave(new Date());
      // Clear save message after auto-save to avoid confusion
      setSaveMessage(null);
    } catch (error) {
      console.error('Auto-save error:', error);
      // Don't show error message for auto-save failures to avoid UI noise
    } finally {
      setAutoSaving(false);
    }
  }, [user, editedProfile, editedPreferences, saving, autoSaving, updateProfile, profileService]);

  // Debounced auto-save with 2-second delay
  const debouncedAutoSave = useMemo(
    () => debounce(autoSave, 2000),
    [autoSave]
  );

  // Trigger auto-save when profile or preferences change
  useEffect(() => {
    debouncedAutoSave();
  }, [editedProfile, editedPreferences, debouncedAutoSave]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-orange-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Authentication Required</h2>
          <p className="text-gray-600">Please sign in to access your profile settings.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Profile Settings</h1>
          <div className="flex items-center space-x-4">
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${completionScore}%` }}
              />
            </div>
            <span className="text-sm font-medium text-gray-600">
              {completionScore}% Complete
            </span>
            {isProfileComplete() && (
              <CheckCircle className="w-5 h-5 text-green-500" />
            )}
          </div>
        </div>

        {/* Save Message */}
        {saveMessage && (
          <div className={`mb-6 p-4 rounded-md ${
            saveMessage.type === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-800' 
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            <div className="flex items-center">
              {saveMessage.type === 'success' ? (
                <CheckCircle className="w-5 h-5 mr-2" />
              ) : (
                <AlertCircle className="w-5 h-5 mr-2" />
              )}
              {saveMessage.text}
            </div>
          </div>
        )}

        {/* Auto-save Status */}
        {(autoSaving || lastAutoSave) && (
          <div className="mb-6 p-3 rounded-md bg-blue-50 border border-blue-200">
            <div className="flex items-center text-sm text-blue-700">
              {autoSaving ? (
                <>
                  <div className="animate-spin w-4 h-4 mr-2 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                  Auto-saving changes...
                </>
              ) : lastAutoSave ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-2 text-blue-600" />
                  Auto-saved at {lastAutoSave.toLocaleTimeString()}
                </>
              ) : null}
            </div>
          </div>
        )}

        {/* Personal Information Section */}
        <ProfileSection
          title="Personal Information"
          icon={<User className="w-5 h-5 text-blue-600" />}
          isExpanded={expandedSections.personal}
          onToggle={() => toggleSection('personal')}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <Input
              label="Display Name"
              value={editedProfile.displayName || ''}
              onChange={(e) => handleProfileChange('displayName', e.target.value)}
              placeholder="Your display name"
              required
            />
            <Input
              label="Email"
              value={editedProfile.email || user.email || ''}
              onChange={(e) => handleProfileChange('email', e.target.value)}
              type="email"
              disabled
              className="bg-gray-50"
            />
            <div className="md:col-span-2">
              <TextArea
                label="Bio"
                value={editedProfile.bio || ''}
                onChange={(e) => handleProfileChange('bio', e.target.value)}
                placeholder="Tell us about yourself..."
                rows={3}
              />
            </div>
            <Input
              label="Pronouns"
              value={editedProfile.pronouns || ''}
              onChange={(e) => handleProfileChange('pronouns', e.target.value)}
              placeholder="e.g., he/him, she/her, they/them"
            />
          </div>
        </ProfileSection>

        {/* Professional Information Section */}
        <ProfileSection
          title="Professional Information"
          icon={<Briefcase className="w-5 h-5 text-green-600" />}
          isExpanded={expandedSections.professional}
          onToggle={() => toggleSection('professional')}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <Input
              label="Current Role"
              value={editedProfile.currentRole || ''}
              onChange={(e) => handleProfileChange('currentRole', e.target.value)}
              placeholder="Your current job title"
            />
            <Input
              label="Years of Experience"
              value={editedProfile.yearsOfExperience || ''}
              onChange={(e) => handleProfileChange('yearsOfExperience', parseInt(e.target.value) || 0)}
              type="number"
              min="0"
              max="50"
              placeholder="0"
              required
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Industry
              </label>
              <select 
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={editedProfile.industry?.[0] || ''}
                onChange={(e) => handleProfileChange('industry', e.target.value ? [e.target.value] : [])}
              >
                <option value="">Select industry</option>
                {INDUSTRY_OPTIONS.map(industry => (
                  <option key={industry} value={industry}>
                    {industry.charAt(0).toUpperCase() + industry.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Target Role
              </label>
              <select 
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={editedProfile.targetRoles?.[0] || ''}
                onChange={(e) => handleProfileChange('targetRoles', e.target.value ? [e.target.value] : [])}
              >
                <option value="">Select target role</option>
                {JOB_POSITIONS.map(position => (
                  <option key={position} value={position}>
                    {position}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Target Company
              </label>
              <select 
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={editedProfile.targetCompanies?.[0] || ''}
                onChange={(e) => handleProfileChange('targetCompanies', e.target.value ? [e.target.value] : [])}
              >
                <option value="">Select target company</option>
                {COMPANY_OPTIONS.map(company => (
                  <option key={company} value={company}>
                    {company}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </ProfileSection>

        {/* Interview Preferences Section */}
        <ProfileSection
          title="Interview Preferences"
          icon={<Settings className="w-5 h-5 text-purple-600" />}
          isExpanded={expandedSections.preferences}
          onToggle={() => toggleSection('preferences')}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preferred Interview Types
              </label>
              <div className="space-y-2">
                {['technical', 'behavioral', 'case_study', 'system_design', 'coding'].map(type => (
                  <label key={type} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={editedProfile.preferredInterviewTypes?.includes(type as any) || false}
                      onChange={(e) => {
                        const current = editedProfile.preferredInterviewTypes || [];
                        if (e.target.checked) {
                          handleProfileChange('preferredInterviewTypes', [...current, type]);
                        } else {
                          handleProfileChange('preferredInterviewTypes', current.filter(t => t !== type));
                        }
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700 capitalize">
                      {type.replace('_', ' ')}
                    </span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Difficulty Preference
              </label>
              <select 
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={editedProfile.difficultyPreference || ''}
                onChange={(e) => handleProfileChange('difficultyPreference', e.target.value)}
              >
                <option value="">Select difficulty</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
                <option value="mixed">Mixed</option>
              </select>
            </div>
            <Input
              label="Session Length (minutes)"
              value={editedProfile.sessionLengthPreference || ''}
              onChange={(e) => handleProfileChange('sessionLengthPreference', parseInt(e.target.value) || 30)}
              type="number"
              min="5"
              max="120"
              placeholder="30"
            />
            <Input
              label="Time Zone"
              value={editedProfile.timeZone || ''}
              onChange={(e) => handleProfileChange('timeZone', e.target.value)}
              placeholder="UTC"
            />
          </div>
        </ProfileSection>

        {/* Privacy Settings Section */}
        <ProfileSection
          title="Privacy Settings"
          icon={<Shield className="w-5 h-5 text-red-600" />}
          isExpanded={expandedSections.privacy}
          onToggle={() => toggleSection('privacy')}
        >
          <div className="space-y-6 mt-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Profile Visibility
              </label>
              <div className="space-y-2">
                {[
                  { value: 'public', label: 'Public - Visible to all users' },
                  { value: 'peers_only', label: 'Peers Only - Visible to other users with profiles' },
                  { value: 'private', label: 'Private - Only visible to you' }
                ].map(option => (
                  <label key={option.value} className="flex items-center">
                    <input
                      type="radio"
                      name="visibility"
                      value={option.value}
                      checked={editedProfile.profileVisibility === option.value}
                      onChange={(e) => handleProfileChange('profileVisibility', e.target.value)}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      {option.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={editedProfile.dataProcessingConsent || false}
                  onChange={(e) => handleProfileChange('dataProcessingConsent', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">
                  I consent to data processing for improving the interview experience
                </span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={editedProfile.marketingConsent || false}
                  onChange={(e) => handleProfileChange('marketingConsent', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">
                  I consent to receiving marketing communications
                </span>
              </label>
            </div>
          </div>
        </ProfileSection>

        {/* Notification Preferences Section */}
        <ProfileSection
          title="Notification Preferences"
          icon={<Bell className="w-5 h-5 text-yellow-600" />}
          isExpanded={expandedSections.notifications}
          onToggle={() => toggleSection('notifications')}
        >
          <div className="space-y-6 mt-6">
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">Email Notifications</h4>
              <div className="space-y-2">
                {[
                  { key: 'weeklyProgress', label: 'Weekly progress reports' },
                  { key: 'practiceReminders', label: 'Practice reminders' },
                  { key: 'newFeatures', label: 'New feature announcements' },
                  { key: 'communityUpdates', label: 'Community updates' }
                ].map(option => (
                  <label key={option.key} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={editedProfile.notificationPreferences?.emailNotifications?.[option.key as keyof typeof editedProfile.notificationPreferences.emailNotifications] || false}
                      onChange={(e) => {
                        const current = editedProfile.notificationPreferences?.emailNotifications || {};
                        handleProfileChange('notificationPreferences', {
                          ...editedProfile.notificationPreferences,
                          emailNotifications: {
                            ...current,
                            [option.key]: e.target.checked
                          }
                        });
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      {option.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">Push Notifications</h4>
              <div className="space-y-2">
                {[
                  { key: 'practiceReminders', label: 'Practice reminders' },
                  { key: 'sessionInvites', label: 'Session invitations' },
                  { key: 'feedbackReceived', label: 'Feedback received' }
                ].map(option => (
                  <label key={option.key} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={editedProfile.notificationPreferences?.pushNotifications?.[option.key as keyof typeof editedProfile.notificationPreferences.pushNotifications] || false}
                      onChange={(e) => {
                        const current = editedProfile.notificationPreferences?.pushNotifications || {};
                        handleProfileChange('notificationPreferences', {
                          ...editedProfile.notificationPreferences,
                          pushNotifications: {
                            ...current,
                            [option.key]: e.target.checked
                          }
                        });
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      {option.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </ProfileSection>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </div>
  );
}