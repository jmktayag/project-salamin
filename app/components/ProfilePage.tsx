'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Save, CheckCircle, AlertCircle, User, Briefcase, Settings, Shield, Bell, Loader2 } from 'lucide-react';
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
import { ProfilePageSkeleton } from './ui/ProfileSkeleton';
import { FieldValidation } from './ui/ValidationMessage';
import { createProfileValidator, useFormValidation } from '../utils/validation';
import { sanitizeProfileData, RateLimiter } from '../utils/sanitization';
import { 
  useFocusManagement, 
  ScreenReaderAnnouncer,
  buildFieldAccessibility 
} from '../utils/accessibility';

interface ProfileSectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  isExpanded: boolean;
  onToggle: () => void;
  sectionId: string;
  ariaLabel?: string;
}

const ProfileSection = React.memo(function ProfileSection({ 
  title, 
  icon, 
  children, 
  isExpanded, 
  onToggle, 
  sectionId,
  ariaLabel 
}: ProfileSectionProps) {
  const headingId = `${sectionId}-heading`;
  const contentId = `${sectionId}-content`;
  
  return (
    <Card className="mb-6">
      <h2>
        <button
          id={headingId}
          onClick={onToggle}
          className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          aria-expanded={isExpanded}
          aria-controls={contentId}
          aria-label={ariaLabel || `${title} section`}
        >
          <div className="flex items-center space-x-3">
            {icon}
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          </div>
          <ChevronDownIcon className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
        </button>
      </h2>
      {isExpanded && (
        <div 
          id={contentId}
          className="px-6 pb-6 border-t border-gray-100"
          role="region"
          aria-labelledby={headingId}
        >
          {children}
        </div>
      )}
    </Card>
  );
});

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
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  
  // Accessibility and validation setup
  const { setFocusRef, focusFirstError } = useFocusManagement();
  const announcer = ScreenReaderAnnouncer.getInstance();
  
  
  // Form validation
  const validator = useMemo(() => createProfileValidator(), []);
  const {
    validationErrors,
    validateField,
    validateForm,
    markFieldTouched,
    clearFieldErrors,
    hasErrors
  } = useFormValidation(validator);
  
  // Rate limiting
  const rateLimiter = useMemo(() => new RateLimiter(5, 60000), []);

  useEffect(() => {
    if (profile) {
      setEditedProfile(profile);
      setIsInitialLoading(false);
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
    // Don't sanitize on keystroke to allow natural typing (including spaces)
    // Sanitization will be applied on save for security
    const sanitizedValue = value;
    
    setEditedProfile(prev => ({ ...prev, [field]: sanitizedValue }));
    
    // Mark field as touched only when user actually changes it
    markFieldTouched(field);
    
    // Re-enable real-time validation with debounce 
    // Only validate fields that have been touched by the user
    setTimeout(() => {
      validateField(field, sanitizedValue, false); // Respect touched state
    }, 300);
  }, [validateField, markFieldTouched]);


  const toggleSection = useCallback((section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
    
    // Announce section state change
    const isExpanding = !expandedSections[section];
    announcer.announce(
      `${section} section ${isExpanding ? 'expanded' : 'collapsed'}`,
      'polite'
    );
  }, [expandedSections, announcer]);

  const handleSave = async () => {
    if (!user) return;
    
    // Check rate limiting
    if (!rateLimiter.isAllowed(user.uid)) {
      const timeLeft = Math.ceil(rateLimiter.getTimeUntilReset(user.uid) / 1000);
      setSaveMessage({ 
        type: 'error', 
        text: `Too many save attempts. Please wait ${timeLeft} seconds before trying again.` 
      });
      return;
    }
    
    // TEMPORARILY DISABLED: Form validation removed to debug blocking save issue
    // const formData = { ...editedProfile, ...editedPreferences };
    // const isValid = validateForm(formData);
    // 
    // if (!isValid) {
    //   announcer.announceFormErrors(validationErrors);
    //   focusFirstError('#profile-form');
    //   setSaveMessage({ type: 'error', text: 'Please fix the errors before saving.' });
    //   return;
    // }

    setSaving(true);
    setSaveMessage(null);

    try {
      // Sanitize data before saving
      const sanitizedProfile = sanitizeProfileData(editedProfile);
      const sanitizedPreferences = sanitizeProfileData(editedPreferences);
      
      // Save profile updates
      if (Object.keys(sanitizedProfile).length > 0) {
        await updateProfile(sanitizedProfile);
      }

      // Save preferences updates
      if (Object.keys(sanitizedPreferences).length > 0) {
        await profileService.updateUserPreferences(user.uid, sanitizedPreferences);
      }

      // Clear validation errors after successful save
      Object.keys(validationErrors).forEach(fieldName => {
        clearFieldErrors(fieldName);
      });
      
      setSaveMessage({ type: 'success', text: 'Profile updated successfully!' });
      announcer.announceSuccess('Profile saved successfully');
    } catch (error) {
      console.error('Save error:', error);
      setSaveMessage({ type: 'error', text: 'Failed to save profile. Please try again.' });
      announcer.announce('Failed to save profile. Please try again.', 'assertive');
    } finally {
      setSaving(false);
    }
  };

  

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-orange-500 mx-auto mb-4" aria-hidden="true" />
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Authentication Required</h1>
          <p className="text-gray-600">Please sign in to access your profile settings.</p>
        </div>
      </div>
    );
  }
  
  if (isInitialLoading) {
    return <ProfilePageSkeleton />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Skip to main content link */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded"
      >
        Skip to main content
      </a>
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <header className="mb-8">
          <h1 
            id="main-content"
            className="text-3xl font-bold text-gray-900 mb-2"
            tabIndex={-1}
            ref={setFocusRef}
          >
            Profile Settings
          </h1>
          <div className="flex items-center space-x-4" role="group" aria-label="Profile completion status">
            <div className="flex-1 bg-gray-200 rounded-full h-2" role="progressbar" aria-valuenow={completionScore} aria-valuemin={0} aria-valuemax={100} aria-label="Profile completion progress">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${completionScore}%` }}
              />
            </div>
            <span className="text-sm font-medium text-gray-600" aria-live="polite">
              {completionScore}% Complete
            </span>
            {isProfileComplete() && (
              <CheckCircle className="w-5 h-5 text-green-500" aria-label="Profile complete" />
            )}
          </div>
          
        </header>

        {/* Save Message */}
        {saveMessage && (
          <div 
            className={`mb-6 p-4 rounded-md ${
              saveMessage.type === 'success' 
                ? 'bg-green-50 border border-green-200 text-green-800' 
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}
            role={saveMessage.type === 'error' ? 'alert' : 'status'}
            aria-live={saveMessage.type === 'error' ? 'assertive' : 'polite'}
          >
            <div className="flex items-center">
              {saveMessage.type === 'success' ? (
                <CheckCircle className="w-5 h-5 mr-2" aria-hidden="true" />
              ) : (
                <AlertCircle className="w-5 h-5 mr-2" aria-hidden="true" />
              )}
              {saveMessage.text}
            </div>
          </div>
        )}

        
        <div 
          id="profile-form"
        >

          {/* Personal Information Section */}
          <ProfileSection
            title="Personal Information"
            icon={<User className="w-5 h-5 text-blue-600" aria-hidden="true" />}
            isExpanded={expandedSections.personal}
            onToggle={() => toggleSection('personal')}
            sectionId="personal-info"
            ariaLabel="Personal information section"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div>
                <Input
                  label="Display Name"
                  value={editedProfile.displayName || ''}
                  onChange={(e) => handleProfileChange('displayName', e.target.value)}
                  onBlur={() => markFieldTouched('displayName')}
                  placeholder="Your display name"
                  required
                  error={validationErrors.displayName?.length > 0}
                  {...buildFieldAccessibility('displayName', {
                    label: 'Display Name',
                    required: true,
                    hasError: validationErrors.displayName?.length > 0
                  })}
                />
                <FieldValidation 
                  errors={validationErrors.displayName} 
                  fieldId="displayName" 
                />
              </div>
              
              <div>
                <Input
                  label="Email"
                  value={editedProfile.email || user.email || ''}
                  onChange={(e) => handleProfileChange('email', e.target.value)}
                  type="email"
                  disabled
                  className="bg-gray-50"
                  aria-describedby="email-help"
                />
                <p id="email-help" className="text-sm text-gray-500 mt-1">
                  Email cannot be changed directly. Contact support if needed.
                </p>
              </div>
              
              <div className="md:col-span-2">
                <TextArea
                  label="Bio"
                  value={editedProfile.bio || ''}
                  onChange={(e) => handleProfileChange('bio', e.target.value)}
                  onBlur={() => markFieldTouched('bio')}
                  placeholder="Tell us about yourself..."
                  rows={3}
                  error={validationErrors.bio?.length > 0}
                  {...buildFieldAccessibility('bio', {
                    label: 'Bio',
                    hasError: validationErrors.bio?.length > 0
                  })}
                />
                <FieldValidation 
                  errors={validationErrors.bio} 
                  fieldId="bio" 
                />
              </div>
              
              <div>
                <Input
                  label="Pronouns"
                  value={editedProfile.pronouns || ''}
                  onChange={(e) => handleProfileChange('pronouns', e.target.value)}
                  onBlur={() => markFieldTouched('pronouns')}
                  placeholder="e.g., he/him, she/her, they/them"
                  error={validationErrors.pronouns?.length > 0}
                  {...buildFieldAccessibility('pronouns', {
                    label: 'Pronouns',
                    hasError: validationErrors.pronouns?.length > 0
                  })}
                />
                <FieldValidation 
                  errors={validationErrors.pronouns} 
                  fieldId="pronouns" 
                />
              </div>
            </div>
          </ProfileSection>

          {/* Professional Information Section */}
          <ProfileSection
            title="Professional Information"
            icon={<Briefcase className="w-5 h-5 text-green-600" aria-hidden="true" />}
            isExpanded={expandedSections.professional}
            onToggle={() => toggleSection('professional')}
            sectionId="professional-info"
            ariaLabel="Professional information section"
          >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div>
              <Input
                label="Current Role"
                value={editedProfile.currentRole || ''}
                onChange={(e) => handleProfileChange('currentRole', e.target.value)}
                onBlur={() => markFieldTouched('currentRole')}
                placeholder="Your current job title"
                error={validationErrors.currentRole?.length > 0}
                {...buildFieldAccessibility('currentRole', {
                  label: 'Current Role',
                  hasError: validationErrors.currentRole?.length > 0
                })}
              />
              <FieldValidation 
                errors={validationErrors.currentRole} 
                fieldId="currentRole" 
              />
            </div>
            <div>
              <Input
                label="Years of Experience"
                value={editedProfile.yearsOfExperience || ''}
                onChange={(e) => handleProfileChange('yearsOfExperience', parseInt(e.target.value) || 0)}
                onBlur={() => markFieldTouched('yearsOfExperience')}
                type="number"
                min="0"
                max="50"
                placeholder="0"
                required
                error={validationErrors.yearsOfExperience?.length > 0}
                {...buildFieldAccessibility('yearsOfExperience', {
                  label: 'Years of Experience',
                  required: true,
                  hasError: validationErrors.yearsOfExperience?.length > 0
                })}
              />
              <FieldValidation 
                errors={validationErrors.yearsOfExperience} 
                fieldId="yearsOfExperience" 
              />
            </div>
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
            icon={<Settings className="w-5 h-5 text-purple-600" aria-hidden="true" />}
            isExpanded={expandedSections.preferences}
            onToggle={() => toggleSection('preferences')}
            sectionId="interview-preferences"
            ariaLabel="Interview preferences section"
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
            <div>
              <Input
                label="Session Length (minutes)"
                value={editedProfile.sessionLengthPreference || ''}
                onChange={(e) => handleProfileChange('sessionLengthPreference', parseInt(e.target.value) || 30)}
                onBlur={() => markFieldTouched('sessionLengthPreference')}
                type="number"
                min="5"
                max="120"
                placeholder="30"
                error={validationErrors.sessionLengthPreference?.length > 0}
                {...buildFieldAccessibility('sessionLengthPreference', {
                  label: 'Session Length',
                  hasError: validationErrors.sessionLengthPreference?.length > 0
                })}
              />
              <FieldValidation 
                errors={validationErrors.sessionLengthPreference} 
                fieldId="sessionLengthPreference" 
              />
            </div>
            <div>
              <Input
                label="Time Zone"
                value={editedProfile.timeZone || ''}
                onChange={(e) => handleProfileChange('timeZone', e.target.value)}
                onBlur={() => markFieldTouched('timeZone')}
                placeholder="UTC"
                error={validationErrors.timeZone?.length > 0}
                {...buildFieldAccessibility('timeZone', {
                  label: 'Time Zone',
                  hasError: validationErrors.timeZone?.length > 0
                })}
              />
              <FieldValidation 
                errors={validationErrors.timeZone} 
                fieldId="timeZone" 
              />
            </div>
          </div>
        </ProfileSection>

          {/* Privacy Settings Section */}
          <ProfileSection
            title="Privacy Settings"
            icon={<Shield className="w-5 h-5 text-red-600" aria-hidden="true" />}
            isExpanded={expandedSections.privacy}
            onToggle={() => toggleSection('privacy')}
            sectionId="privacy-settings"
            ariaLabel="Privacy settings section"
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
            icon={<Bell className="w-5 h-5 text-yellow-600" aria-hidden="true" />}
            isExpanded={expandedSections.notifications}
            onToggle={() => toggleSection('notifications')}
            sectionId="notification-preferences"
            ariaLabel="Notification preferences section"
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
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500">
              {/* Status area - currently empty, reserved for future use */}
            </div>
            
            <div className="flex space-x-3">
              <Button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-8 py-3 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" aria-hidden="true" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>
          
          {/* TEMPORARILY DISABLED: Error display removed with validation
          {hasErrors && (
            <div id="form-errors" className="mt-4 text-sm text-red-600" role="alert">
              Please fix the errors above before saving.
            </div>
          )}
          */}
        </div>
      </div>
    </div>
  );
}