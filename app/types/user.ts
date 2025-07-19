import { Timestamp } from 'firebase/firestore';

// Base user interface from existing auth system
export interface User {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
}

// Interview types from existing system
export type InterviewType = 'behavioral' | 'technical' | 'case_study' | 'system_design' | 'coding';

// Enhanced user profile interface
export interface UserProfile {
  // Core Identity
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  bio?: string;
  pronouns?: string;
  
  // Professional Information
  currentRole?: string;
  yearsOfExperience: number;
  industry: string[];
  targetRoles: string[];
  targetCompanies: string[];
  targetSalaryRange?: SalaryRange;
  
  // Interview Preferences
  preferredInterviewTypes: InterviewType[];
  difficultyPreference: 'beginner' | 'intermediate' | 'advanced' | 'mixed';
  sessionLengthPreference: number; // minutes
  availableTimeSlots: TimeSlot[];
  timeZone: string;
  
  // Privacy & Notifications
  profileVisibility: 'public' | 'peers_only' | 'private';
  notificationPreferences: NotificationSettings;
  dataProcessingConsent: boolean;
  marketingConsent: boolean;
  
  // System Data
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastLoginAt: Timestamp;
  accountStatus: 'active' | 'suspended' | 'pending_verification';
  subscriptionTier: 'free' | 'premium' | 'professional';
  
  // Profile completion tracking
  profileCompletionScore: number; // 0-100
  completedSections: ProfileSection[];
}

// Supporting interfaces
export interface SalaryRange {
  min: number;
  max: number;
  currency: string;
}

export interface TimeSlot {
  dayOfWeek: number; // 0-6, Sunday-Saturday
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
}

export interface NotificationSettings {
  emailNotifications: {
    weeklyProgress: boolean;
    practiceReminders: boolean;
    newFeatures: boolean;
    communityUpdates: boolean;
  };
  pushNotifications: {
    practiceReminders: boolean;
    sessionInvites: boolean;
    feedbackReceived: boolean;
  };
}

export type ProfileSection = 
  | 'personal_info'
  | 'professional_info' 
  | 'interview_preferences'
  | 'privacy_settings'
  | 'notification_preferences';

// User preferences stored separately for frequent updates
export interface UserPreferences {
  userId: string;
  theme: 'light' | 'dark' | 'system';
  language: string;
  practiceReminders: boolean;
  reminderTime: string; // HH:MM format
  sessionSettings: SessionSettings;
  updatedAt: Timestamp;
}

export interface SessionSettings {
  audioEnabled: boolean;
  speechRecognitionEnabled: boolean;
  autoAdvanceQuestions: boolean;
  showHints: boolean;
  pauseBetweenQuestions: number; // seconds
}

// User statistics for analytics (computed/derived data)
export interface UserStatistics {
  userId: string;
  
  // Practice Statistics
  totalSessions: number;
  completedSessions: number;
  totalPracticeTime: number; // minutes
  averageSessionDuration: number; // minutes
  
  // Performance Metrics
  averageScore: number;
  bestScore: number;
  improvementRate: number; // percentage change over time
  currentStreak: number;
  longestStreak: number;
  
  // Question Analytics
  questionsAnswered: number;
  questionsByCategory: Record<string, number>;
  questionsByDifficulty: Record<string, number>;
  strongestCategories: string[];
  weakestCategories: string[];
  
  // Progress Tracking
  goalsCompleted: number;
  milestonesReached: string[];
  skillBadgesEarned: string[];
  
  // Time-based Analytics
  practiceTimeByWeek: TimeSeriesData[];
  scoreProgressByWeek: TimeSeriesData[];
  categoryImprovementOverTime: Record<string, TimeSeriesData[]>;
  
  // Comparative Data
  percentileRank: number; // compared to other users
  industryPercentile?: number; // compared to users in same industry
  rolePercentile?: number; // compared to users with same target role
  
  // System Data
  lastCalculated: Timestamp;
  calculationVersion: string; // for schema migrations
}

export interface TimeSeriesData {
  date: string; // YYYY-MM-DD format
  value: number;
  sessionCount?: number;
}

// Constants for profile options
export const INDUSTRY_OPTIONS = [
  'technology',
  'finance',
  'healthcare',
  'consulting',
  'education',
  'retail',
  'manufacturing',
  'media',
  'non-profit',
  'government',
  'startup',
  'other'
] as const;

export const JOB_POSITIONS = [
  'Software Engineer',
  'Senior Software Engineer',
  'Staff Engineer',
  'Principal Engineer',
  'Engineering Manager',
  'Senior Engineering Manager',
  'Director of Engineering',
  'VP of Engineering',
  'CTO',
  'Product Manager',
  'Senior Product Manager',
  'Director of Product',
  'VP of Product',
  'Data Scientist',
  'Senior Data Scientist',
  'Data Engineer',
  'Machine Learning Engineer',
  'DevOps Engineer',
  'Site Reliability Engineer',
  'Security Engineer',
  'Frontend Developer',
  'Backend Developer',
  'Full Stack Developer',
  'Mobile Developer',
  'QA Engineer',
  'UX Designer',
  'UI Designer',
  'Product Designer',
  'Design Manager',
  'Business Analyst',
  'Technical Writer',
  'Sales Engineer',
  'Customer Success Manager',
  'Marketing Manager',
  'Operations Manager',
  'Consultant',
  'Project Manager',
  'Scrum Master',
  'Other'
] as const;

export const COMPANY_OPTIONS = [
  'Google',
  'Microsoft',
  'Amazon',
  'Apple',
  'Meta',
  'Netflix',
  'Tesla',
  'Salesforce',
  'Adobe',
  'Oracle',
  'IBM',
  'Intel',
  'NVIDIA',
  'Uber',
  'Airbnb',
  'Spotify',
  'Twitter',
  'LinkedIn',
  'Slack',
  'Zoom',
  'Dropbox',
  'GitHub',
  'Atlassian',
  'Stripe',
  'Square',
  'PayPal',
  'Goldman Sachs',
  'JPMorgan Chase',
  'Morgan Stanley',
  'McKinsey & Company',
  'Boston Consulting Group',
  'Bain & Company',
  'Deloitte',
  'PwC',
  'EY',
  'KPMG',
  'Other'
] as const;

export const CURRENCY_OPTIONS = [
  { value: 'USD', label: 'USD ($)' },
  { value: 'EUR', label: 'EUR (€)' },
  { value: 'GBP', label: 'GBP (£)' },
  { value: 'CAD', label: 'CAD (C$)' },
  { value: 'AUD', label: 'AUD (A$)' },
  { value: 'JPY', label: 'JPY (¥)' },
  { value: 'INR', label: 'INR (₹)' },
  { value: 'SGD', label: 'SGD (S$)' },
] as const;

// Type guards and utility functions
export function isCompleteProfile(profile: Partial<UserProfile>): profile is UserProfile {
  return !!(
    profile.uid &&
    profile.email &&
    profile.displayName &&
    profile.yearsOfExperience !== undefined &&
    profile.industry &&
    profile.preferredInterviewTypes &&
    profile.difficultyPreference &&
    profile.sessionLengthPreference &&
    profile.timeZone &&
    profile.profileVisibility &&
    profile.notificationPreferences &&
    profile.dataProcessingConsent !== undefined &&
    profile.marketingConsent !== undefined
  );
}

export function calculateProfileCompletionScore(profile: Partial<UserProfile>): number {
  const sections = {
    basicInfo: !!(profile.displayName && profile.email),
    personalInfo: !!(profile.bio && profile.pronouns),
    professionalInfo: !!(
      profile.currentRole &&
      profile.yearsOfExperience !== undefined &&
      profile.industry?.length &&
      profile.targetRoles?.length
    ),
    preferences: !!(
      profile.preferredInterviewTypes?.length &&
      profile.difficultyPreference &&
      profile.sessionLengthPreference &&
      profile.timeZone
    ),
    privacy: !!(
      profile.profileVisibility &&
      profile.dataProcessingConsent !== undefined &&
      profile.marketingConsent !== undefined
    ),
    notifications: !!(profile.notificationPreferences)
  };

  const completedSections = Object.values(sections).filter(Boolean).length;
  return Math.round((completedSections / Object.keys(sections).length) * 100);
}

export function getDefaultNotificationSettings(): NotificationSettings {
  return {
    emailNotifications: {
      weeklyProgress: true,
      practiceReminders: true,
      newFeatures: false,
      communityUpdates: false
    },
    pushNotifications: {
      practiceReminders: true,
      sessionInvites: true,
      feedbackReceived: true
    }
  };
}

export function getDefaultUserPreferences(userId: string): UserPreferences {
  return {
    userId,
    theme: 'system',
    language: 'en',
    practiceReminders: true,
    reminderTime: '18:00',
    sessionSettings: {
      audioEnabled: true,
      speechRecognitionEnabled: true,
      autoAdvanceQuestions: false,
      showHints: true,
      pauseBetweenQuestions: 3
    },
    updatedAt: Timestamp.now()
  };
}