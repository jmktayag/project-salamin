import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  orderBy,
  getDocs,
  serverTimestamp,
  writeBatch,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/app/lib/firebase/config';
import {
  UserProfile,
  UserPreferences,
  UserStatistics,
  ProfileSection,
  getDefaultNotificationSettings,
  getDefaultUserPreferences,
  calculateProfileCompletionScore,
  isCompleteProfile
} from '@/app/types/user';

export class ProfileService {
  private static instance: ProfileService;
  private cache = new Map<string, { profile: UserProfile; timestamp: number }>();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  public static getInstance(): ProfileService {
    if (!ProfileService.instance) {
      ProfileService.instance = new ProfileService();
    }
    return ProfileService.instance;
  }

  // Profile CRUD Operations
  
  /**
   * Create a new user profile with sensible defaults
   */
  async createProfile(uid: string, initialData: Partial<UserProfile>): Promise<UserProfile> {
    try {
      const profileRef = doc(db, 'users', uid, 'profile', 'data');
      
      const defaultProfile: UserProfile = {
        uid,
        email: initialData.email || '',
        displayName: initialData.displayName || '',
        photoURL: initialData.photoURL,
        yearsOfExperience: 0,
        industry: [],
        targetRoles: [],
        targetCompanies: [],
        preferredInterviewTypes: ['behavioral'],
        difficultyPreference: 'intermediate',
        sessionLengthPreference: 30,
        availableTimeSlots: [],
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        profileVisibility: 'peers_only',
        notificationPreferences: getDefaultNotificationSettings(),
        dataProcessingConsent: false,
        marketingConsent: false,
        createdAt: serverTimestamp() as Timestamp,
        updatedAt: serverTimestamp() as Timestamp,
        lastLoginAt: serverTimestamp() as Timestamp,
        accountStatus: 'active',
        subscriptionTier: 'free',
        profileCompletionScore: 0,
        completedSections: ['personal_info'], // Basic info is considered complete
        ...initialData
      };

      // Calculate initial completion score
      defaultProfile.profileCompletionScore = calculateProfileCompletionScore(defaultProfile);

      await setDoc(profileRef, defaultProfile);

      // Create default preferences
      await this.createUserPreferences(uid);

      // Initialize empty statistics
      await this.initializeUserStatistics(uid);

      // Clear cache and update
      this.cache.delete(uid);
      this.cache.set(uid, { profile: defaultProfile, timestamp: Date.now() });

      return defaultProfile;
    } catch (error) {
      console.error('Error creating user profile:', error);
      throw new Error('Failed to create user profile');
    }
  }

  /**
   * Get user profile by UID with caching
   */
  async getProfile(uid: string): Promise<UserProfile | null> {
    try {
      // Check cache first
      const cached = this.cache.get(uid);
      if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
        return cached.profile;
      }

      const profileRef = doc(db, 'users', uid, 'profile', 'data');
      const profileSnap = await getDoc(profileRef);

      if (!profileSnap.exists()) {
        return null;
      }

      const profile = profileSnap.data() as UserProfile;
      
      // Update cache
      this.cache.set(uid, { profile, timestamp: Date.now() });
      
      return profile;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw new Error('Failed to fetch user profile');
    }
  }

  /**
   * Update user profile with timestamp management
   */
  async updateProfile(uid: string, updates: Partial<UserProfile>): Promise<void> {
    try {
      const profileRef = doc(db, 'users', uid, 'profile', 'data');
      
      // Get current profile to calculate new completion score
      const currentProfile = await this.getProfile(uid);
      if (!currentProfile) {
        throw new Error('Profile not found');
      }

      const updatedProfile = { ...currentProfile, ...updates };
      const newCompletionScore = calculateProfileCompletionScore(updatedProfile);

      const updateData = {
        ...updates,
        updatedAt: serverTimestamp(),
        profileCompletionScore: newCompletionScore,
        completedSections: this.getCompletedSections(updatedProfile)
      };

      await updateDoc(profileRef, updateData);

      // Clear cache to force refresh on next get
      this.cache.delete(uid);

      // Log profile update event for analytics
      await this.logProfileEvent(uid, 'profile_updated', {
        sections: Object.keys(updates),
        completionScore: newCompletionScore
      });
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw new Error('Failed to update user profile');
    }
  }

  /**
   * Update last login timestamp
   */
  async updateLastLogin(uid: string): Promise<void> {
    try {
      const profileRef = doc(db, 'users', uid, 'profile', 'data');
      await updateDoc(profileRef, {
        lastLoginAt: serverTimestamp()
      });

      // Clear cache
      this.cache.delete(uid);
    } catch (error) {
      console.error('Error updating last login:', error);
      // Don't throw error for login timestamp updates
    }
  }

  /**
   * Delete user profile and all associated data
   */
  async deleteProfile(uid: string): Promise<void> {
    try {
      const batch = writeBatch(db);

      // Delete profile
      const profileRef = doc(db, 'users', uid, 'profile', 'data');
      batch.delete(profileRef);

      // Delete preferences
      const preferencesRef = doc(db, 'users', uid, 'preferences', 'data');
      batch.delete(preferencesRef);

      // Delete statistics
      const statisticsRef = doc(db, 'users', uid, 'statistics', 'current');
      batch.delete(statisticsRef);

      await batch.commit();

      // Clear cache
      this.cache.delete(uid);

      // Log deletion event
      await this.logProfileEvent(uid, 'profile_deleted', {});
    } catch (error) {
      console.error('Error deleting user profile:', error);
      throw new Error('Failed to delete user profile');
    }
  }

  // User Preferences Management

  /**
   * Create default user preferences
   */
  async createUserPreferences(uid: string): Promise<UserPreferences> {
    try {
      const preferencesRef = doc(db, 'users', uid, 'preferences', 'data');
      const preferences = getDefaultUserPreferences(uid);
      
      await setDoc(preferencesRef, preferences);
      return preferences;
    } catch (error) {
      console.error('Error creating user preferences:', error);
      throw new Error('Failed to create user preferences');
    }
  }

  /**
   * Get user preferences
   */
  async getUserPreferences(uid: string): Promise<UserPreferences | null> {
    try {
      const preferencesRef = doc(db, 'users', uid, 'preferences', 'data');
      const preferencesSnap = await getDoc(preferencesRef);

      if (!preferencesSnap.exists()) {
        // Create default preferences if they don't exist
        return await this.createUserPreferences(uid);
      }

      return preferencesSnap.data() as UserPreferences;
    } catch (error) {
      console.error('Error fetching user preferences:', error);
      throw new Error('Failed to fetch user preferences');
    }
  }

  /**
   * Update user preferences
   */
  async updateUserPreferences(uid: string, updates: Partial<UserPreferences>): Promise<void> {
    try {
      const preferencesRef = doc(db, 'users', uid, 'preferences', 'data');
      
      await updateDoc(preferencesRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating user preferences:', error);
      throw new Error('Failed to update user preferences');
    }
  }

  // User Statistics Management

  /**
   * Initialize empty user statistics
   */
  async initializeUserStatistics(uid: string): Promise<UserStatistics> {
    try {
      const statisticsRef = doc(db, 'users', uid, 'statistics', 'current');
      
      const initialStats: UserStatistics = {
        userId: uid,
        totalSessions: 0,
        completedSessions: 0,
        totalPracticeTime: 0,
        averageSessionDuration: 0,
        averageScore: 0,
        bestScore: 0,
        improvementRate: 0,
        currentStreak: 0,
        longestStreak: 0,
        questionsAnswered: 0,
        questionsByCategory: {},
        questionsByDifficulty: {},
        strongestCategories: [],
        weakestCategories: [],
        goalsCompleted: 0,
        milestonesReached: [],
        skillBadgesEarned: [],
        practiceTimeByWeek: [],
        scoreProgressByWeek: [],
        categoryImprovementOverTime: {},
        percentileRank: 0,
        lastCalculated: serverTimestamp() as Timestamp,
        calculationVersion: '1.0'
      };

      await setDoc(statisticsRef, initialStats);
      return initialStats;
    } catch (error) {
      console.error('Error initializing user statistics:', error);
      throw new Error('Failed to initialize user statistics');
    }
  }

  /**
   * Get user statistics
   */
  async getUserStatistics(uid: string): Promise<UserStatistics | null> {
    try {
      const statisticsRef = doc(db, 'users', uid, 'statistics', 'current');
      const statisticsSnap = await getDoc(statisticsRef);

      if (!statisticsSnap.exists()) {
        return await this.initializeUserStatistics(uid);
      }

      return statisticsSnap.data() as UserStatistics;
    } catch (error) {
      console.error('Error fetching user statistics:', error);
      throw new Error('Failed to fetch user statistics');
    }
  }

  // Profile Completion Helpers

  /**
   * Get completed profile sections based on profile data
   */
  private getCompletedSections(profile: Partial<UserProfile>): ProfileSection[] {
    const sections: ProfileSection[] = [];

    // Personal info
    if (profile.displayName && profile.email) {
      sections.push('personal_info');
    }

    // Professional info
    if (
      profile.currentRole &&
      profile.yearsOfExperience !== undefined &&
      profile.industry?.length &&
      profile.targetRoles?.length
    ) {
      sections.push('professional_info');
    }

    // Interview preferences
    if (
      profile.preferredInterviewTypes?.length &&
      profile.difficultyPreference &&
      profile.sessionLengthPreference &&
      profile.timeZone
    ) {
      sections.push('interview_preferences');
    }

    // Privacy settings
    if (
      profile.profileVisibility &&
      profile.dataProcessingConsent !== undefined &&
      profile.marketingConsent !== undefined
    ) {
      sections.push('privacy_settings');
    }

    // Notification preferences
    if (profile.notificationPreferences) {
      sections.push('notification_preferences');
    }

    return sections;
  }

  /**
   * Check if profile is complete enough for full features
   */
  async isProfileComplete(uid: string): Promise<boolean> {
    try {
      const profile = await this.getProfile(uid);
      return profile ? isCompleteProfile(profile) : false;
    } catch (error) {
      console.error('Error checking profile completion:', error);
      return false;
    }
  }

  /**
   * Get profiles by visibility for community features (future use)
   */
  async getPublicProfiles(limit: number = 10): Promise<UserProfile[]> {
    try {
      const profilesQuery = query(
        collection(db, 'users'),
        where('profile.profileVisibility', '==', 'public'),
        orderBy('profile.updatedAt', 'desc')
      );

      const querySnapshot = await getDocs(profilesQuery);
      const profiles: UserProfile[] = [];

      querySnapshot.forEach((doc) => {
        const profileData = doc.data().profile;
        if (profileData) {
          profiles.push(profileData as UserProfile);
        }
      });

      return profiles.slice(0, limit);
    } catch (error) {
      console.error('Error fetching public profiles:', error);
      return [];
    }
  }

  // Analytics and Logging

  /**
   * Log profile events for analytics
   */
  private async logProfileEvent(
    uid: string,
    eventType: string,
    metadata: Record<string, any>
  ): Promise<void> {
    try {
      // This would integrate with your existing analytics system
      // For now, we'll just log to console in development
      if (process.env.NODE_ENV === 'development') {
        console.log('Profile Event:', {
          uid,
          eventType,
          metadata,
          timestamp: new Date().toISOString()
        });
      }

      // In production, this would send to Firebase Analytics or your analytics service
      // Example: analytics.track(eventType, { uid, ...metadata });
    } catch (error) {
      console.error('Error logging profile event:', error);
      // Don't throw error for logging failures
    }
  }

  // Cache Management

  /**
   * Clear profile cache for a specific user
   */
  clearCache(uid: string): void {
    this.cache.delete(uid);
  }

  /**
   * Clear all cached profiles
   */
  clearAllCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics (for debugging)
   */
  getCacheStats(): { size: number; entries: string[] } {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys())
    };
  }
}

// Export singleton instance
export const profileService = ProfileService.getInstance();