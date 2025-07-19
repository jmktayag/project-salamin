/**
 * Firestore Security Rules Tests
 * 
 * These tests validate the security rules for the enhanced user profile system.
 * To run these tests with the Firebase emulator:
 * 
 * 1. Install Firebase CLI: npm install -g firebase-tools
 * 2. Start emulator: firebase emulators:start --only firestore
 * 3. Run tests: npm test firestore-rules.test.js
 */

const { initializeTestEnvironment, assertFails, assertSucceeds } = require('@firebase/rules-unit-testing');
const fs = require('fs');
const path = require('path');

const PROJECT_ID = 'test-salamin-profile';
const RULES_FILE = path.join(__dirname, '../firestore.rules');

let testEnv;

describe('Firestore Security Rules', () => {
  beforeAll(async () => {
    // Initialize test environment with security rules
    testEnv = await initializeTestEnvironment({
      projectId: PROJECT_ID,
      firestore: {
        rules: fs.readFileSync(RULES_FILE, 'utf8'),
      },
    });
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  afterEach(async () => {
    await testEnv.clearFirestore();
  });

  describe('User Profile Access', () => {
    const userId = 'test-user-123';
    const otherUserId = 'other-user-456';
    
    const validProfile = {
      uid: userId,
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
      notificationPreferences: {
        emailNotifications: {
          weeklyProgress: true,
          practiceReminders: true,
          newFeatures: false,
          communityUpdates: false,
        },
        pushNotifications: {
          practiceReminders: true,
          sessionInvites: true,
          feedbackReceived: true,
        },
      },
      dataProcessingConsent: true,
      marketingConsent: false,
      createdAt: { seconds: Date.now() / 1000, nanoseconds: 0 },
      updatedAt: { seconds: Date.now() / 1000, nanoseconds: 0 },
      lastLoginAt: { seconds: Date.now() / 1000, nanoseconds: 0 },
      accountStatus: 'active',
      subscriptionTier: 'free',
      profileCompletionScore: 75,
      completedSections: ['personal_info', 'professional_info'],
    };

    it('should allow users to read their own profile', async () => {
      const userContext = testEnv.authenticatedContext(userId);
      const profileRef = userContext.firestore().doc(`users/${userId}/profile/data`);
      
      await profileRef.set(validProfile);
      
      await assertSucceeds(profileRef.get());
    });

    it('should allow users to write their own profile', async () => {
      const userContext = testEnv.authenticatedContext(userId);
      const profileRef = userContext.firestore().doc(`users/${userId}/profile/data`);
      
      await assertSucceeds(profileRef.set(validProfile));
    });

    it('should deny access to other users private profiles', async () => {
      const ownerContext = testEnv.authenticatedContext(userId);
      const otherContext = testEnv.authenticatedContext(otherUserId);
      
      const profileRef = ownerContext.firestore().doc(`users/${userId}/profile/data`);
      const privateProfile = { ...validProfile, profileVisibility: 'private' };
      
      await profileRef.set(privateProfile);
      
      const otherProfileRef = otherContext.firestore().doc(`users/${userId}/profile/data`);
      await assertFails(otherProfileRef.get());
    });

    it('should allow access to public profiles', async () => {
      const ownerContext = testEnv.authenticatedContext(userId);
      const otherContext = testEnv.authenticatedContext(otherUserId);
      
      const profileRef = ownerContext.firestore().doc(`users/${userId}/profile/data`);
      const publicProfile = { ...validProfile, profileVisibility: 'public' };
      
      await profileRef.set(publicProfile);
      
      const otherProfileRef = otherContext.firestore().doc(`users/${userId}/profile/data`);
      await assertSucceeds(otherProfileRef.get());
    });

    it('should allow peers to access peers-only profiles', async () => {
      const ownerContext = testEnv.authenticatedContext(userId);
      const peerContext = testEnv.authenticatedContext(otherUserId);
      
      // Create profiles for both users
      const ownerProfileRef = ownerContext.firestore().doc(`users/${userId}/profile/data`);
      const peerProfileRef = peerContext.firestore().doc(`users/${otherUserId}/profile/data`);
      
      const peersOnlyProfile = { ...validProfile, profileVisibility: 'peers_only' };
      const peerProfile = { ...validProfile, uid: otherUserId, email: 'peer@example.com' };
      
      await ownerProfileRef.set(peersOnlyProfile);
      await peerProfileRef.set(peerProfile);
      
      // Peer should be able to read the peers-only profile
      const peerReadRef = peerContext.firestore().doc(`users/${userId}/profile/data`);
      await assertSucceeds(peerReadRef.get());
    });

    it('should deny unauthenticated access', async () => {
      const unauthenticatedContext = testEnv.unauthenticatedContext();
      const profileRef = unauthenticatedContext.firestore().doc(`users/${userId}/profile/data`);
      
      await assertFails(profileRef.get());
      await assertFails(profileRef.set(validProfile));
    });

    it('should deny writing to other users profiles', async () => {
      const otherContext = testEnv.authenticatedContext(otherUserId);
      const profileRef = otherContext.firestore().doc(`users/${userId}/profile/data`);
      
      await assertFails(profileRef.set(validProfile));
    });
  });

  describe('User Preferences Access', () => {
    const userId = 'test-user-123';
    const otherUserId = 'other-user-456';
    
    const validPreferences = {
      userId,
      theme: 'dark',
      language: 'en',
      practiceReminders: true,
      reminderTime: '18:00',
      sessionSettings: {
        audioEnabled: true,
        speechRecognitionEnabled: true,
        autoAdvanceQuestions: false,
        showHints: true,
        pauseBetweenQuestions: 3,
      },
      updatedAt: { seconds: Date.now() / 1000, nanoseconds: 0 },
    };

    it('should allow users to access their own preferences', async () => {
      const userContext = testEnv.authenticatedContext(userId);
      const prefsRef = userContext.firestore().doc(`users/${userId}/preferences/data`);
      
      await assertSucceeds(prefsRef.set(validPreferences));
      await assertSucceeds(prefsRef.get());
    });

    it('should deny access to other users preferences', async () => {
      const ownerContext = testEnv.authenticatedContext(userId);
      const otherContext = testEnv.authenticatedContext(otherUserId);
      
      const prefsRef = ownerContext.firestore().doc(`users/${userId}/preferences/data`);
      await prefsRef.set(validPreferences);
      
      const otherPrefsRef = otherContext.firestore().doc(`users/${userId}/preferences/data`);
      await assertFails(otherPrefsRef.get());
      await assertFails(otherPrefsRef.set(validPreferences));
    });
  });

  describe('User Statistics Access', () => {
    const userId = 'test-user-123';
    const otherUserId = 'other-user-456';
    
    const validStatistics = {
      userId,
      totalSessions: 10,
      completedSessions: 8,
      totalPracticeTime: 300,
      averageScore: 85,
      currentStreak: 5,
      questionsAnswered: 50,
      lastCalculated: { seconds: Date.now() / 1000, nanoseconds: 0 },
    };

    it('should allow users to access their own statistics', async () => {
      const userContext = testEnv.authenticatedContext(userId);
      const statsRef = userContext.firestore().doc(`users/${userId}/statistics/current`);
      
      await assertSucceeds(statsRef.set(validStatistics));
      await assertSucceeds(statsRef.get());
    });

    it('should deny access to other users statistics', async () => {
      const ownerContext = testEnv.authenticatedContext(userId);
      const otherContext = testEnv.authenticatedContext(otherUserId);
      
      const statsRef = ownerContext.firestore().doc(`users/${userId}/statistics/current`);
      await statsRef.set(validStatistics);
      
      const otherStatsRef = otherContext.firestore().doc(`users/${userId}/statistics/current`);
      await assertFails(otherStatsRef.get());
      await assertFails(otherStatsRef.set(validStatistics));
    });
  });

  describe('Data Validation', () => {
    const userId = 'test-user-123';

    it('should validate profile data structure', async () => {
      const userContext = testEnv.authenticatedContext(userId);
      const profileRef = userContext.firestore().doc(`users/${userId}/profile/data`);
      
      // Valid profile should succeed
      const validProfile = {
        uid: userId,
        email: 'test@example.com',
        displayName: 'Test User',
        yearsOfExperience: 2,
        industry: ['technology'],
        targetRoles: ['Software Engineer'],
        targetCompanies: [],
        preferredInterviewTypes: ['technical'],
        difficultyPreference: 'intermediate',
        sessionLengthPreference: 30,
        timeZone: 'UTC',
        profileVisibility: 'peers_only',
        dataProcessingConsent: true,
        marketingConsent: false,
        accountStatus: 'active',
        subscriptionTier: 'free',
        createdAt: { seconds: Date.now() / 1000, nanoseconds: 0 },
        updatedAt: { seconds: Date.now() / 1000, nanoseconds: 0 },
      };
      
      await assertSucceeds(profileRef.set(validProfile));
      
      // Invalid profiles should fail
      const invalidProfiles = [
        { ...validProfile, uid: '' }, // Empty UID
        { ...validProfile, email: '' }, // Empty email
        { ...validProfile, yearsOfExperience: -1 }, // Negative experience
        { ...validProfile, yearsOfExperience: 100 }, // Too much experience
        { ...validProfile, difficultyPreference: 'invalid' }, // Invalid difficulty
        { ...validProfile, sessionLengthPreference: 200 }, // Too long session
        { ...validProfile, profileVisibility: 'invalid' }, // Invalid visibility
        { ...validProfile, accountStatus: 'invalid' }, // Invalid status
        { ...validProfile, subscriptionTier: 'invalid' }, // Invalid tier
      ];
      
      for (const invalidProfile of invalidProfiles) {
        await assertFails(profileRef.set(invalidProfile));
      }
    });

    it('should validate preferences data structure', async () => {
      const userContext = testEnv.authenticatedContext(userId);
      const prefsRef = userContext.firestore().doc(`users/${userId}/preferences/data`);
      
      // Valid preferences should succeed
      const validPreferences = {
        userId,
        theme: 'dark',
        language: 'en',
        practiceReminders: true,
        updatedAt: { seconds: Date.now() / 1000, nanoseconds: 0 },
      };
      
      await assertSucceeds(prefsRef.set(validPreferences));
      
      // Invalid preferences should fail
      const invalidPreferences = [
        { ...validPreferences, userId: '' }, // Empty userId
        { ...validPreferences, theme: 'invalid' }, // Invalid theme
        { ...validPreferences, practiceReminders: 'not-boolean' }, // Wrong type
      ];
      
      for (const invalidPref of invalidPreferences) {
        await assertFails(prefsRef.set(invalidPref));
      }
    });

    it('should validate statistics data structure', async () => {
      const userContext = testEnv.authenticatedContext(userId);
      const statsRef = userContext.firestore().doc(`users/${userId}/statistics/current`);
      
      // Valid statistics should succeed
      const validStatistics = {
        userId,
        totalSessions: 10,
        completedSessions: 8,
        totalPracticeTime: 300,
        averageScore: 85,
        currentStreak: 5,
      };
      
      await assertSucceeds(statsRef.set(validStatistics));
      
      // Invalid statistics should fail
      const invalidStatistics = [
        { ...validStatistics, userId: '' }, // Empty userId
        { ...validStatistics, totalSessions: 'not-number' }, // Wrong type
        { ...validStatistics, averageScore: 'not-number' }, // Wrong type
      ];
      
      for (const invalidStat of invalidStatistics) {
        await assertFails(statsRef.set(invalidStat));
      }
    });
  });

  describe('Interview Sessions (existing functionality)', () => {
    const userId = 'test-user-123';
    const otherUserId = 'other-user-456';
    
    const validSession = {
      userId,
      type: 'technical',
      status: 'in_progress',
      createdAt: { seconds: Date.now() / 1000, nanoseconds: 0 },
    };

    it('should allow users to access their own sessions', async () => {
      const userContext = testEnv.authenticatedContext(userId);
      const sessionRef = userContext.firestore().doc(`interviewSessions/session-123`);
      
      await assertSucceeds(sessionRef.set(validSession));
      await assertSucceeds(sessionRef.get());
    });

    it('should deny access to other users sessions', async () => {
      const ownerContext = testEnv.authenticatedContext(userId);
      const otherContext = testEnv.authenticatedContext(otherUserId);
      
      const sessionRef = ownerContext.firestore().doc(`interviewSessions/session-123`);
      await sessionRef.set(validSession);
      
      const otherSessionRef = otherContext.firestore().doc(`interviewSessions/session-123`);
      await assertFails(otherSessionRef.get());
    });
  });

  describe('Daily Challenges', () => {
    const userId = 'test-user-123';
    
    const validChallenge = {
      id: 'challenge-123',
      date: '2023-12-01',
      type: 'quick_practice',
      title: 'Lightning Round',
      description: 'Complete 5 questions in 15 minutes',
    };

    it('should allow authenticated users to read challenges', async () => {
      const adminContext = testEnv.authenticatedContext('admin');
      const userContext = testEnv.authenticatedContext(userId);
      
      // Admin creates challenge (would be done by cloud function)
      const challengeRef = adminContext.firestore().doc(`dailyChallenges/challenge-123`);
      await challengeRef.set(validChallenge);
      
      // User should be able to read
      const userChallengeRef = userContext.firestore().doc(`dailyChallenges/challenge-123`);
      await assertSucceeds(userChallengeRef.get());
    });

    it('should deny write access to challenges', async () => {
      const userContext = testEnv.authenticatedContext(userId);
      const challengeRef = userContext.firestore().doc(`dailyChallenges/challenge-123`);
      
      await assertFails(challengeRef.set(validChallenge));
    });
  });

  describe('User Subcollections', () => {
    const userId = 'test-user-123';
    const otherUserId = 'other-user-456';

    it('should allow users to manage their goals', async () => {
      const userContext = testEnv.authenticatedContext(userId);
      const goalRef = userContext.firestore().doc(`users/${userId}/goals/goal-123`);
      
      const validGoal = {
        id: 'goal-123',
        userId,
        type: 'practice_frequency',
        title: 'Practice 5 times this week',
        targetValue: 5,
        currentValue: 2,
        status: 'active',
      };
      
      await assertSucceeds(goalRef.set(validGoal));
      await assertSucceeds(goalRef.get());
    });

    it('should allow users to read their badges', async () => {
      const userContext = testEnv.authenticatedContext(userId);
      const badgeRef = userContext.firestore().doc(`users/${userId}/badges/badge-123`);
      
      const validBadge = {
        badgeId: 'first_interview',
        userId,
        earnedAt: { seconds: Date.now() / 1000, nanoseconds: 0 },
      };
      
      // User can read their badges
      await assertSucceeds(badgeRef.get());
      
      // But typically can't write (would be done by cloud function)
      // This rule might be relaxed for testing
    });

    it('should allow users to manage their notifications', async () => {
      const userContext = testEnv.authenticatedContext(userId);
      const notificationRef = userContext.firestore().doc(`users/${userId}/notifications/notif-123`);
      
      const validNotification = {
        type: 'badge_earned',
        title: 'Badge Unlocked!',
        message: 'You earned your first badge',
        read: false,
        createdAt: { seconds: Date.now() / 1000, nanoseconds: 0 },
      };
      
      await assertSucceeds(notificationRef.set(validNotification));
      await assertSucceeds(notificationRef.get());
    });

    it('should deny access to other users subcollections', async () => {
      const ownerContext = testEnv.authenticatedContext(userId);
      const otherContext = testEnv.authenticatedContext(otherUserId);
      
      // Owner creates a goal
      const goalRef = ownerContext.firestore().doc(`users/${userId}/goals/goal-123`);
      const validGoal = {
        id: 'goal-123',
        userId,
        type: 'practice_frequency',
        title: 'Practice 5 times this week',
        targetValue: 5,
        currentValue: 2,
        status: 'active',
      };
      await goalRef.set(validGoal);
      
      // Other user should not be able to access
      const otherGoalRef = otherContext.firestore().doc(`users/${userId}/goals/goal-123`);
      await assertFails(otherGoalRef.get());
      await assertFails(otherGoalRef.set(validGoal));
    });
  });
});