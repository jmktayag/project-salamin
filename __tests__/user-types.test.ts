import {
  UserProfile,
  UserPreferences,
  isCompleteProfile,
  calculateProfileCompletionScore,
  getDefaultNotificationSettings,
  getDefaultUserPreferences,
  INDUSTRY_OPTIONS,
  JOB_POSITIONS,
  COMPANY_OPTIONS,
  CURRENCY_OPTIONS,
} from '@/app/types/user';
import { Timestamp } from 'firebase/firestore';

// Mock Timestamp for tests
jest.mock('firebase/firestore', () => ({
  Timestamp: {
    now: jest.fn(() => ({ nanoseconds: 0, seconds: Date.now() / 1000 })),
    fromDate: jest.fn((date: Date) => ({ nanoseconds: 0, seconds: date.getTime() / 1000 })),
  },
}));

describe('User Types Utilities', () => {
  const mockTimestamp = { nanoseconds: 0, seconds: Date.now() / 1000 } as any;
  const mockUserId = 'test-user-123';

  const createBasicProfile = (overrides: Partial<UserProfile> = {}): UserProfile => ({
    uid: mockUserId,
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
    createdAt: mockTimestamp,
    updatedAt: mockTimestamp,
    lastLoginAt: mockTimestamp,
    accountStatus: 'active',
    subscriptionTier: 'free',
    profileCompletionScore: 75,
    completedSections: ['personal_info', 'professional_info'],
    ...overrides,
  });

  describe('isCompleteProfile', () => {
    it('should return true for a complete profile', () => {
      const completeProfile = createBasicProfile();
      
      expect(isCompleteProfile(completeProfile)).toBe(true);
    });

    it('should return false for profile missing required fields', () => {
      const incompleteProfiles = [
        createBasicProfile({ uid: '' }),
        createBasicProfile({ email: '' }),
        createBasicProfile({ displayName: '' }),
        createBasicProfile({ yearsOfExperience: undefined as any }),
        createBasicProfile({ industry: undefined as any }),
        createBasicProfile({ preferredInterviewTypes: undefined as any }),
        createBasicProfile({ difficultyPreference: undefined as any }),
        createBasicProfile({ sessionLengthPreference: undefined as any }),
        createBasicProfile({ timeZone: undefined as any }),
        createBasicProfile({ profileVisibility: undefined as any }),
        createBasicProfile({ notificationPreferences: undefined as any }),
        createBasicProfile({ dataProcessingConsent: undefined as any }),
        createBasicProfile({ marketingConsent: undefined as any }),
      ];

      incompleteProfiles.forEach((profile, index) => {
        expect(isCompleteProfile(profile)).toBe(false);
      });
    });

    it('should return false for partial profile objects', () => {
      const partialProfile = {
        uid: mockUserId,
        email: 'test@example.com',
        // Missing many required fields
      };

      expect(isCompleteProfile(partialProfile)).toBe(false);
    });
  });

  describe('calculateProfileCompletionScore', () => {
    it('should return 100 for a fully complete profile', () => {
      const completeProfile = createBasicProfile({
        bio: 'Software engineer',
        pronouns: 'he/him',
        currentRole: 'Junior Developer',
        targetCompanies: ['Google', 'Apple'],
      });

      const score = calculateProfileCompletionScore(completeProfile);
      expect(score).toBe(100);
    });

    it('should return partial scores for incomplete profiles', () => {
      // Only basic info
      const basicProfile = {
        uid: mockUserId,
        email: 'test@example.com',
        displayName: 'Test User',
      };

      const score = calculateProfileCompletionScore(basicProfile);
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThan(100);
    });

    it('should return 0 for empty profile', () => {
      const emptyProfile = {};

      const score = calculateProfileCompletionScore(emptyProfile);
      expect(score).toBe(0);
    });

    it('should calculate incremental scores correctly', () => {
      const profiles = [
        // Basic info only
        {
          email: 'test@example.com',
          displayName: 'Test User',
        },
        // Basic + personal
        {
          email: 'test@example.com',
          displayName: 'Test User',
          bio: 'Software engineer',
          pronouns: 'he/him',
        },
        // Basic + personal + professional
        {
          email: 'test@example.com',
          displayName: 'Test User',
          bio: 'Software engineer',
          pronouns: 'he/him',
          currentRole: 'Developer',
          yearsOfExperience: 2,
          industry: ['technology'],
          targetRoles: ['Senior Developer'],
        },
      ];

      const scores = profiles.map(calculateProfileCompletionScore);
      
      // Each profile should have a higher score than the previous
      expect(scores[1]).toBeGreaterThan(scores[0]);
      expect(scores[2]).toBeGreaterThan(scores[1]);
    });
  });

  describe('getDefaultNotificationSettings', () => {
    it('should return proper notification settings structure', () => {
      const settings = getDefaultNotificationSettings();

      expect(settings).toHaveProperty('emailNotifications');
      expect(settings).toHaveProperty('pushNotifications');
      
      expect(settings.emailNotifications).toHaveProperty('weeklyProgress');
      expect(settings.emailNotifications).toHaveProperty('practiceReminders');
      expect(settings.emailNotifications).toHaveProperty('newFeatures');
      expect(settings.emailNotifications).toHaveProperty('communityUpdates');
      
      expect(settings.pushNotifications).toHaveProperty('practiceReminders');
      expect(settings.pushNotifications).toHaveProperty('sessionInvites');
      expect(settings.pushNotifications).toHaveProperty('feedbackReceived');
    });

    it('should return sensible defaults', () => {
      const settings = getDefaultNotificationSettings();

      // Should enable helpful notifications by default
      expect(settings.emailNotifications.weeklyProgress).toBe(true);
      expect(settings.emailNotifications.practiceReminders).toBe(true);
      expect(settings.pushNotifications.practiceReminders).toBe(true);
      expect(settings.pushNotifications.sessionInvites).toBe(true);
      expect(settings.pushNotifications.feedbackReceived).toBe(true);

      // Should disable potentially annoying notifications by default
      expect(settings.emailNotifications.newFeatures).toBe(false);
      expect(settings.emailNotifications.communityUpdates).toBe(false);
    });
  });

  describe('getDefaultUserPreferences', () => {
    it('should return proper preferences structure', () => {
      const preferences = getDefaultUserPreferences(mockUserId);

      expect(preferences.userId).toBe(mockUserId);
      expect(preferences).toHaveProperty('theme');
      expect(preferences).toHaveProperty('language');
      expect(preferences).toHaveProperty('practiceReminders');
      expect(preferences).toHaveProperty('reminderTime');
      expect(preferences).toHaveProperty('sessionSettings');
      expect(preferences).toHaveProperty('updatedAt');
    });

    it('should return sensible defaults', () => {
      const preferences = getDefaultUserPreferences(mockUserId);

      expect(preferences.theme).toBe('system');
      expect(preferences.language).toBe('en');
      expect(preferences.practiceReminders).toBe(true);
      expect(preferences.reminderTime).toBe('18:00');
      
      // Session settings
      expect(preferences.sessionSettings.audioEnabled).toBe(true);
      expect(preferences.sessionSettings.speechRecognitionEnabled).toBe(true);
      expect(preferences.sessionSettings.autoAdvanceQuestions).toBe(false);
      expect(preferences.sessionSettings.showHints).toBe(true);
      expect(preferences.sessionSettings.pauseBetweenQuestions).toBe(3);
    });

    it('should include timestamp', () => {
      const preferences = getDefaultUserPreferences(mockUserId);

      expect(preferences.updatedAt).toBeDefined();
      expect(typeof preferences.updatedAt.seconds).toBe('number');
    });
  });

  describe('constants validation', () => {
    it('should have valid industry options', () => {
      expect(INDUSTRY_OPTIONS).toContain('technology');
      expect(INDUSTRY_OPTIONS).toContain('finance');
      expect(INDUSTRY_OPTIONS).toContain('healthcare');
      expect(INDUSTRY_OPTIONS).toContain('other');
      
      // Should be unique
      const uniqueIndustries = Array.from(new Set(INDUSTRY_OPTIONS));
      expect(uniqueIndustries.length).toBe(INDUSTRY_OPTIONS.length);
    });

    it('should have valid job positions', () => {
      expect(JOB_POSITIONS).toContain('Software Engineer');
      expect(JOB_POSITIONS).toContain('Product Manager');
      expect(JOB_POSITIONS).toContain('Data Scientist');
      expect(JOB_POSITIONS).toContain('Other');
      
      // Should be unique
      const uniquePositions = Array.from(new Set(JOB_POSITIONS));
      expect(uniquePositions.length).toBe(JOB_POSITIONS.length);
    });

    it('should have valid company options', () => {
      expect(COMPANY_OPTIONS).toContain('Google');
      expect(COMPANY_OPTIONS).toContain('Microsoft');
      expect(COMPANY_OPTIONS).toContain('Amazon');
      expect(COMPANY_OPTIONS).toContain('Other');
      
      // Should be unique
      const uniqueCompanies = Array.from(new Set(COMPANY_OPTIONS));
      expect(uniqueCompanies.length).toBe(COMPANY_OPTIONS.length);
    });

    it('should have valid currency options with proper structure', () => {
      expect(CURRENCY_OPTIONS).toContainEqual({ value: 'USD', label: 'USD ($)' });
      expect(CURRENCY_OPTIONS).toContainEqual({ value: 'EUR', label: 'EUR (€)' });
      expect(CURRENCY_OPTIONS).toContainEqual({ value: 'GBP', label: 'GBP (£)' });
      
      // All options should have value and label
      CURRENCY_OPTIONS.forEach(option => {
        expect(option).toHaveProperty('value');
        expect(option).toHaveProperty('label');
        expect(typeof option.value).toBe('string');
        expect(typeof option.label).toBe('string');
      });
    });
  });

  describe('profile sections completion', () => {
    it('should identify completed sections correctly', () => {
      const profileWithBasicInfo = createBasicProfile({
        bio: undefined,
        pronouns: undefined,
        currentRole: undefined,
      });

      // This profile should have basic info completed
      const score = calculateProfileCompletionScore(profileWithBasicInfo);
      expect(score).toBeGreaterThan(0);
    });

    it('should handle missing optional fields gracefully', () => {
      const profileWithOptionalFields = createBasicProfile({
        bio: undefined,
        pronouns: undefined,
        photoURL: undefined,
        targetSalaryRange: undefined,
        availableTimeSlots: [],
      });

      // Should still calculate completion score
      const score = calculateProfileCompletionScore(profileWithOptionalFields);
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThan(100);
    });
  });

  describe('type safety', () => {
    it('should enforce required fields in UserProfile', () => {
      // This test ensures TypeScript compilation catches missing required fields
      const profile: UserProfile = createBasicProfile();
      
      // These should all exist and be the correct type
      expect(typeof profile.uid).toBe('string');
      expect(typeof profile.email).toBe('string');
      expect(typeof profile.displayName).toBe('string');
      expect(typeof profile.yearsOfExperience).toBe('number');
      expect(Array.isArray(profile.industry)).toBe(true);
      expect(Array.isArray(profile.targetRoles)).toBe(true);
      expect(Array.isArray(profile.preferredInterviewTypes)).toBe(true);
      expect(['beginner', 'intermediate', 'advanced', 'mixed']).toContain(profile.difficultyPreference);
      expect(typeof profile.sessionLengthPreference).toBe('number');
      expect(typeof profile.timeZone).toBe('string');
      expect(['public', 'peers_only', 'private']).toContain(profile.profileVisibility);
      expect(typeof profile.dataProcessingConsent).toBe('boolean');
      expect(typeof profile.marketingConsent).toBe('boolean');
      expect(['active', 'suspended', 'pending_verification']).toContain(profile.accountStatus);
      expect(['free', 'premium', 'professional']).toContain(profile.subscriptionTier);
    });

    it('should enforce required fields in UserPreferences', () => {
      const preferences: UserPreferences = getDefaultUserPreferences(mockUserId);
      
      expect(typeof preferences.userId).toBe('string');
      expect(['light', 'dark', 'system']).toContain(preferences.theme);
      expect(typeof preferences.language).toBe('string');
      expect(typeof preferences.practiceReminders).toBe('boolean');
      expect(typeof preferences.reminderTime).toBe('string');
      expect(typeof preferences.sessionSettings).toBe('object');
      expect(preferences.updatedAt).toBeDefined();
      expect(typeof preferences.updatedAt.seconds).toBe('number');
    });
  });
});