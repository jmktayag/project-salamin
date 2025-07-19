import { ProfileService } from '@/app/utils/ProfileService';
import { UserProfile, UserPreferences, getDefaultNotificationSettings } from '@/app/types/user';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';

// Mock Firebase modules
jest.mock('firebase/firestore');
jest.mock('@/app/lib/firebase/config');

const mockDoc = doc as jest.MockedFunction<typeof doc>;
const mockGetDoc = getDoc as jest.MockedFunction<typeof getDoc>;
const mockSetDoc = setDoc as jest.MockedFunction<typeof setDoc>;
const mockUpdateDoc = updateDoc as jest.MockedFunction<typeof updateDoc>;
const mockDeleteDoc = deleteDoc as jest.MockedFunction<typeof deleteDoc>;
const mockServerTimestamp = serverTimestamp as jest.MockedFunction<typeof serverTimestamp>;

describe('ProfileService', () => {
  let profileService: ProfileService;
  const mockUserId = 'test-user-123';
  const mockTimestamp = { nanoseconds: 0, seconds: Date.now() / 1000 } as Timestamp;

  beforeEach(() => {
    jest.clearAllMocks();
    profileService = ProfileService.getInstance();
    profileService.clearAllCache();

    // Setup default mocks
    mockServerTimestamp.mockReturnValue(mockTimestamp as any);
    mockDoc.mockReturnValue({} as any);
  });

  describe('createProfile', () => {
    it('should create a new profile with default values', async () => {
      const initialData = {
        email: 'test@example.com',
        displayName: 'Test User',
      };

      mockSetDoc.mockResolvedValueOnce(undefined);

      const result = await profileService.createProfile(mockUserId, initialData);

      expect(mockSetDoc).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          uid: mockUserId,
          email: 'test@example.com',
          displayName: 'Test User',
          yearsOfExperience: 0,
          industry: [],
          targetRoles: [],
          preferredInterviewTypes: ['behavioral'],
          difficultyPreference: 'intermediate',
          sessionLengthPreference: 30,
          profileVisibility: 'peers_only',
          accountStatus: 'active',
          subscriptionTier: 'free',
          dataProcessingConsent: false,
          marketingConsent: false,
          notificationPreferences: getDefaultNotificationSettings(),
        })
      );

      expect(result).toMatchObject({
        uid: mockUserId,
        email: 'test@example.com',
        displayName: 'Test User',
      });
    });

    it('should calculate initial profile completion score', async () => {
      const initialData = {
        email: 'test@example.com',
        displayName: 'Test User',
      };

      mockSetDoc.mockResolvedValueOnce(undefined);

      const result = await profileService.createProfile(mockUserId, initialData);

      expect(result.profileCompletionScore).toBeGreaterThan(0);
      expect(result.completedSections).toContain('personal_info');
    });

    it('should handle profile creation errors', async () => {
      const initialData = {
        email: 'test@example.com',
        displayName: 'Test User',
      };

      mockSetDoc.mockRejectedValueOnce(new Error('Firestore error'));

      await expect(
        profileService.createProfile(mockUserId, initialData)
      ).rejects.toThrow('Failed to create user profile');
    });
  });

  describe('getProfile', () => {
    it('should return profile when it exists', async () => {
      const mockProfile: UserProfile = {
        uid: mockUserId,
        email: 'test@example.com',
        displayName: 'Test User',
        yearsOfExperience: 2,
        industry: ['technology'],
        targetRoles: ['Software Engineer'],
        targetCompanies: [],
        preferredInterviewTypes: ['technical'],
        difficultyPreference: 'intermediate',
        sessionLengthPreference: 45,
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
      };

      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => mockProfile,
      } as any);

      const result = await profileService.getProfile(mockUserId);

      expect(result).toEqual(mockProfile);
      expect(mockGetDoc).toHaveBeenCalledTimes(1);
    });

    it('should return null when profile does not exist', async () => {
      mockGetDoc.mockResolvedValueOnce({
        exists: () => false,
      } as any);

      const result = await profileService.getProfile(mockUserId);

      expect(result).toBeNull();
    });

    it('should use cache on subsequent calls', async () => {
      const mockProfile: Partial<UserProfile> = {
        uid: mockUserId,
        email: 'test@example.com',
        displayName: 'Test User',
      };

      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => mockProfile,
      } as any);

      // First call
      await profileService.getProfile(mockUserId);
      
      // Second call should use cache
      const result = await profileService.getProfile(mockUserId);

      expect(mockGetDoc).toHaveBeenCalledTimes(1);
      expect(result).toMatchObject(mockProfile);
    });

    it('should handle Firestore errors', async () => {
      mockGetDoc.mockRejectedValueOnce(new Error('Firestore error'));

      await expect(profileService.getProfile(mockUserId)).rejects.toThrow(
        'Failed to fetch user profile'
      );
    });
  });

  describe('updateProfile', () => {
    it('should update profile and clear cache', async () => {
      const mockExistingProfile: UserProfile = {
        uid: mockUserId,
        email: 'test@example.com',
        displayName: 'Test User',
        yearsOfExperience: 1,
        industry: ['technology'],
        targetRoles: [],
        targetCompanies: [],
        preferredInterviewTypes: ['behavioral'],
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
        profileCompletionScore: 50,
        completedSections: ['personal_info'],
      };

      // Mock getting existing profile
      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => mockExistingProfile,
      } as any);

      mockUpdateDoc.mockResolvedValueOnce(undefined);

      const updates = {
        bio: 'Software engineer with 2 years of experience',
        currentRole: 'Junior Developer',
        yearsOfExperience: 2,
      };

      await profileService.updateProfile(mockUserId, updates);

      expect(mockUpdateDoc).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          ...updates,
          updatedAt: mockTimestamp,
          profileCompletionScore: expect.any(Number),
          completedSections: expect.any(Array),
        })
      );
    });

    it('should throw error when profile not found', async () => {
      mockGetDoc.mockResolvedValueOnce({
        exists: () => false,
      } as any);

      const updates = { bio: 'New bio' };

      await expect(
        profileService.updateProfile(mockUserId, updates)
      ).rejects.toThrow('Profile not found');
    });

    it('should handle update errors', async () => {
      const mockProfile: Partial<UserProfile> = {
        uid: mockUserId,
        email: 'test@example.com',
      };

      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => mockProfile,
      } as any);

      mockUpdateDoc.mockRejectedValueOnce(new Error('Update failed'));

      const updates = { bio: 'New bio' };

      await expect(
        profileService.updateProfile(mockUserId, updates)
      ).rejects.toThrow('Failed to update user profile');
    });
  });

  describe('updateLastLogin', () => {
    it('should update last login timestamp', async () => {
      mockUpdateDoc.mockResolvedValueOnce(undefined);

      await profileService.updateLastLogin(mockUserId);

      expect(mockUpdateDoc).toHaveBeenCalledWith(
        expect.any(Object),
        { lastLoginAt: mockTimestamp }
      );
    });

    it('should not throw on login update errors', async () => {
      mockUpdateDoc.mockRejectedValueOnce(new Error('Update failed'));

      // Should not throw
      await expect(
        profileService.updateLastLogin(mockUserId)
      ).resolves.toBeUndefined();
    });
  });

  describe('getUserPreferences', () => {
    it('should return preferences when they exist', async () => {
      const mockPreferences: UserPreferences = {
        userId: mockUserId,
        theme: 'dark',
        language: 'en',
        practiceReminders: true,
        reminderTime: '18:00',
        sessionSettings: {
          audioEnabled: true,
          speechRecognitionEnabled: false,
          autoAdvanceQuestions: true,
          showHints: false,
          pauseBetweenQuestions: 5,
        },
        updatedAt: mockTimestamp,
      };

      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => mockPreferences,
      } as any);

      const result = await profileService.getUserPreferences(mockUserId);

      expect(result).toEqual(mockPreferences);
    });

    it('should create default preferences when they do not exist', async () => {
      mockGetDoc.mockResolvedValueOnce({
        exists: () => false,
      } as any);

      mockSetDoc.mockResolvedValueOnce(undefined);

      const result = await profileService.getUserPreferences(mockUserId);

      expect(mockSetDoc).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          userId: mockUserId,
          theme: 'system',
          language: 'en',
          practiceReminders: true,
        })
      );

      expect(result?.userId).toBe(mockUserId);
    });
  });

  describe('isProfileComplete', () => {
    it('should return true for complete profiles', async () => {
      const completeProfile: UserProfile = {
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
        profileCompletionScore: 100,
        completedSections: ['personal_info', 'professional_info', 'interview_preferences'],
      };

      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => completeProfile,
      } as any);

      const result = await profileService.isProfileComplete(mockUserId);

      expect(result).toBe(true);
    });

    it('should return false for incomplete profiles', async () => {
      const incompleteProfile: Partial<UserProfile> = {
        uid: mockUserId,
        email: 'test@example.com',
        // Missing required fields
      };

      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => incompleteProfile,
      } as any);

      const result = await profileService.isProfileComplete(mockUserId);

      expect(result).toBe(false);
    });

    it('should return false when profile does not exist', async () => {
      mockGetDoc.mockResolvedValueOnce({
        exists: () => false,
      } as any);

      const result = await profileService.isProfileComplete(mockUserId);

      expect(result).toBe(false);
    });
  });

  describe('cache management', () => {
    it('should clear specific user cache', () => {
      // Add item to cache first
      profileService.clearCache(mockUserId);

      const stats = profileService.getCacheStats();
      expect(stats.entries).not.toContain(mockUserId);
    });

    it('should clear all cache', () => {
      profileService.clearAllCache();

      const stats = profileService.getCacheStats();
      expect(stats.size).toBe(0);
      expect(stats.entries).toEqual([]);
    });

    it('should provide cache statistics', () => {
      const stats = profileService.getCacheStats();

      expect(stats).toHaveProperty('size');
      expect(stats).toHaveProperty('entries');
      expect(typeof stats.size).toBe('number');
      expect(Array.isArray(stats.entries)).toBe(true);
    });
  });

  describe('singleton pattern', () => {
    it('should return the same instance', () => {
      const instance1 = ProfileService.getInstance();
      const instance2 = ProfileService.getInstance();

      expect(instance1).toBe(instance2);
    });
  });
});