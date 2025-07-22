# Phase 1: Foundation Enhancement (Weeks 1-4)

**Objective**: Establish missing core features for user engagement and retention  
**Timeline**: 4 weeks  
**Team Size**: 6 people  
**Budget**: $120,000  

---

## Overview

Phase 1 focuses on building the foundational user experience improvements that will drive engagement and retention. These features are essential prerequisites for the more advanced capabilities in subsequent phases.

### Success Metrics
- **User Engagement**: 60%+ weekly active user rate
- **Profile Completion**: 80%+ of users complete enhanced profiles
- **Analytics Usage**: 70%+ of users access analytics dashboard weekly
- **Retention Improvement**: 25%+ increase in 30-day retention rate

---

## Feature 1: User Profile & Settings System

### 1.1 Enhanced User Profile

#### Current State Analysis
The existing `AuthProvider` handles basic Firebase authentication with minimal profile data:
```typescript
// Current user data structure (limited)
interface User {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
}
```

#### Target State
```typescript
// Enhanced user profile structure
interface UserProfile {
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
  targetSalaryRange?: {
    min: number;
    max: number;
    currency: string;
  };
  
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
}

interface NotificationSettings {
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

interface TimeSlot {
  dayOfWeek: number; // 0-6, Sunday-Saturday
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
}
```

#### Implementation Plan

**Week 1: Database Schema & Backend**
```typescript
// 1. Firestore collection structure
/users/{uid}/profile (UserProfile document)
/users/{uid}/preferences (separate for frequently updated data)
/users/{uid}/statistics (derived data, updated via cloud functions)

// 2. Firebase Security Rules Enhancement
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      // Users can only access their own profile
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      match /profile {
        allow read: if request.auth != null && 
          (request.auth.uid == userId || 
           resource.data.profileVisibility == 'public' ||
           (resource.data.profileVisibility == 'peers_only' && 
            exists(/databases/$(database)/documents/users/$(request.auth.uid)/profile)));
        allow write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}

// 3. Profile Service Implementation
export class ProfileService {
  private db = getFirestore();
  
  async createProfile(uid: string, initialData: Partial<UserProfile>): Promise<void> {
    const profileRef = doc(this.db, 'users', uid, 'profile', 'data');
    const defaultProfile: UserProfile = {
      uid,
      email: initialData.email!,
      displayName: initialData.displayName || '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      accountStatus: 'active',
      subscriptionTier: 'free',
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
      notificationPreferences: this.getDefaultNotificationSettings(),
      dataProcessingConsent: false,
      marketingConsent: false,
      ...initialData
    };
    
    await setDoc(profileRef, defaultProfile);
  }
  
  async updateProfile(uid: string, updates: Partial<UserProfile>): Promise<void> {
    const profileRef = doc(this.db, 'users', uid, 'profile', 'data');
    await updateDoc(profileRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  }
  
  async getProfile(uid: string): Promise<UserProfile | null> {
    const profileRef = doc(this.db, 'users', uid, 'profile', 'data');
    const profileSnap = await getDoc(profileRef);
    return profileSnap.exists() ? profileSnap.data() as UserProfile : null;
  }
  
  private getDefaultNotificationSettings(): NotificationSettings {
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
}
```

**Week 1-2: UI Components**
```typescript
// ProfileSettings.tsx - Main profile management component
interface ProfileSettingsProps {
  user: User;
  onProfileUpdate: (updates: Partial<UserProfile>) => void;
}

export function ProfileSettings({ user, onProfileUpdate }: ProfileSettingsProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'personal' | 'professional' | 'preferences' | 'privacy'>('personal');
  
  const tabs = [
    { id: 'personal', label: 'Personal Info', icon: User },
    { id: 'professional', label: 'Professional', icon: Briefcase },
    { id: 'preferences', label: 'Preferences', icon: Settings },
    { id: 'privacy', label: 'Privacy', icon: Shield }
  ];
  
  return (
    <div className="gi-profile-settings">
      <div className="gi-profile-header">
        <h1>Profile Settings</h1>
        <p>Customize your interview preparation experience</p>
      </div>
      
      <div className="gi-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`gi-tab ${activeTab === tab.id ? 'active' : ''}`}
          >
            <tab.icon className="gi-tab-icon" />
            {tab.label}
          </button>
        ))}
      </div>
      
      <div className="gi-tab-content">
        {activeTab === 'personal' && <PersonalInfoTab profile={profile} onUpdate={onProfileUpdate} />}
        {activeTab === 'professional' && <ProfessionalInfoTab profile={profile} onUpdate={onProfileUpdate} />}
        {activeTab === 'preferences' && <PreferencesTab profile={profile} onUpdate={onProfileUpdate} />}
        {activeTab === 'privacy' && <PrivacySettingsTab profile={profile} onUpdate={onProfileUpdate} />}
      </div>
    </div>
  );
}

// PersonalInfoTab.tsx
function PersonalInfoTab({ profile, onUpdate }: TabProps) {
  const [formData, setFormData] = useState({
    displayName: profile?.displayName || '',
    bio: profile?.bio || '',
    pronouns: profile?.pronouns || '',
    timeZone: profile?.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone
  });
  
  return (
    <form onSubmit={handleSubmit} className="gi-form">
      <FormField label="Display Name" required>
        <Input
          value={formData.displayName}
          onChange={(e) => setFormData({...formData, displayName: e.target.value})}
          placeholder="How you'd like others to see your name"
        />
      </FormField>
      
      <FormField label="Bio" description="Tell others about your background and goals">
        <TextArea
          value={formData.bio}
          onChange={(e) => setFormData({...formData, bio: e.target.value})}
          placeholder="Share your background, goals, or what you're working towards..."
          maxLength={300}
        />
      </FormField>
      
      <FormField label="Pronouns" description="Help others address you correctly">
        <Select
          value={formData.pronouns}
          onChange={(value) => setFormData({...formData, pronouns: value})}
          options={[
            { value: 'he/him', label: 'he/him' },
            { value: 'she/her', label: 'she/her' },
            { value: 'they/them', label: 'they/them' },
            { value: 'other', label: 'Other/Prefer not to say' }
          ]}
        />
      </FormField>
      
      <FormField label="Time Zone">
        <TimeZoneSelect
          value={formData.timeZone}
          onChange={(timeZone) => setFormData({...formData, timeZone})}
        />
      </FormField>
      
      <div className="gi-form-actions">
        <Button type="submit" variant="primary">Save Changes</Button>
      </div>
    </form>
  );
}

// ProfessionalInfoTab.tsx
function ProfessionalInfoTab({ profile, onUpdate }: TabProps) {
  return (
    <form onSubmit={handleSubmit} className="gi-form">
      <FormField label="Current Role">
        <AutocompleteInput
          value={formData.currentRole}
          onChange={(value) => setFormData({...formData, currentRole: value})}
          suggestions={JOB_POSITIONS} // Reuse existing job positions data
          placeholder="e.g., Software Engineer, Product Manager"
        />
      </FormField>
      
      <FormField label="Years of Experience">
        <Select
          value={formData.yearsOfExperience.toString()}
          onChange={(value) => setFormData({...formData, yearsOfExperience: parseInt(value)})}
          options={[
            { value: '0', label: 'Less than 1 year' },
            { value: '1', label: '1-2 years' },
            { value: '3', label: '3-5 years' },
            { value: '6', label: '6-10 years' },
            { value: '11', label: '10+ years' }
          ]}
        />
      </FormField>
      
      <FormField label="Industries" description="Select up to 3 industries you're interested in">
        <MultiSelect
          value={formData.industry}
          onChange={(industries) => setFormData({...formData, industry: industries.slice(0, 3)})}
          options={INDUSTRY_OPTIONS}
          maxSelections={3}
        />
      </FormField>
      
      <FormField label="Target Roles" description="What positions are you preparing for?">
        <MultiSelect
          value={formData.targetRoles}
          onChange={(roles) => setFormData({...formData, targetRoles: roles.slice(0, 5)})}
          options={JOB_POSITIONS}
          maxSelections={5}
          allowCustom={true}
        />
      </FormField>
      
      <FormField label="Target Companies" description="Companies you're interested in (optional)">
        <MultiSelect
          value={formData.targetCompanies}
          onChange={(companies) => setFormData({...formData, targetCompanies: companies.slice(0, 10)})}
          options={COMPANY_OPTIONS}
          maxSelections={10}
          allowCustom={true}
        />
      </FormField>
      
      <FormField label="Target Salary Range" description="Optional - helps with role-appropriate questions">
        <div className="gi-salary-range">
          <Input
            type="number"
            value={formData.targetSalaryRange?.min || ''}
            onChange={(e) => setFormData({
              ...formData, 
              targetSalaryRange: {
                ...formData.targetSalaryRange,
                min: parseInt(e.target.value),
                currency: 'USD'
              }
            })}
            placeholder="Min"
          />
          <span>to</span>
          <Input
            type="number"
            value={formData.targetSalaryRange?.max || ''}
            onChange={(e) => setFormData({
              ...formData, 
              targetSalaryRange: {
                ...formData.targetSalaryRange,
                max: parseInt(e.target.value),
                currency: 'USD'
              }
            })}
            placeholder="Max"
          />
          <Select
            value={formData.targetSalaryRange?.currency || 'USD'}
            onChange={(currency) => setFormData({
              ...formData,
              targetSalaryRange: { ...formData.targetSalaryRange, currency }
            })}
            options={CURRENCY_OPTIONS}
          />
        </div>
      </FormField>
    </form>
  );
}
```

### 1.2 Account Management Features

#### Implementation: Account Settings Component
```typescript
// AccountManagement.tsx
export function AccountManagement({ user }: { user: User }) {
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [showDataExport, setShowDataExport] = useState(false);
  
  return (
    <div className="gi-account-management">
      <section className="gi-section">
        <h2>Account Security</h2>
        <div className="gi-setting-group">
          <SettingItem
            title="Change Password"
            description="Update your account password"
            action={<Button variant="outline" onClick={handlePasswordReset}>Reset Password</Button>}
          />
          
          <SettingItem
            title="Two-Factor Authentication"
            description="Add an extra layer of security to your account"
            action={<Button variant="outline">Set up 2FA</Button>}
          />
          
          <SettingItem
            title="Login Sessions"
            description="Manage your active login sessions"
            action={<Button variant="outline">View Sessions</Button>}
          />
        </div>
      </section>
      
      <section className="gi-section">
        <h2>Data & Privacy</h2>
        <div className="gi-setting-group">
          <SettingItem
            title="Export Data"
            description="Download all your interview data and progress"
            action={<Button variant="outline" onClick={() => setShowDataExport(true)}>Export Data</Button>}
          />
          
          <SettingItem
            title="Data Processing Consent"
            description="Control how we use your data to improve our service"
            action={
              <Switch
                checked={profile?.dataProcessingConsent || false}
                onChange={handleDataConsentChange}
              />
            }
          />
          
          <SettingItem
            title="Marketing Communications"
            description="Receive updates about new features and tips"
            action={
              <Switch
                checked={profile?.marketingConsent || false}
                onChange={handleMarketingConsentChange}
              />
            }
          />
        </div>
      </section>
      
      <section className="gi-section gi-danger-zone">
        <h2>Danger Zone</h2>
        <div className="gi-setting-group">
          <SettingItem
            title="Delete Account"
            description="Permanently delete your account and all associated data"
            action={
              <Button 
                variant="destructive" 
                onClick={() => setShowDeleteConfirmation(true)}
              >
                Delete Account
              </Button>
            }
          />
        </div>
      </section>
      
      {showDeleteConfirmation && (
        <AccountDeletionModal
          onConfirm={handleAccountDeletion}
          onCancel={() => setShowDeleteConfirmation(false)}
        />
      )}
      
      {showDataExport && (
        <DataExportModal
          onClose={() => setShowDataExport(false)}
        />
      )}
    </div>
  );
}
```

---

## Feature 2: Enhanced Analytics Dashboard

### 2.1 User Statistics System

#### Data Structure Design
```typescript
// User statistics tracked automatically
interface UserStatistics {
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

interface TimeSeriesData {
  date: string; // YYYY-MM-DD format
  value: number;
  sessionCount?: number;
}

// Goal tracking system
interface UserGoal {
  id: string;
  userId: string;
  type: 'practice_frequency' | 'score_improvement' | 'category_mastery' | 'streak_maintenance';
  title: string;
  description: string;
  targetValue: number;
  currentValue: number;
  targetDate: Timestamp;
  status: 'active' | 'completed' | 'expired' | 'paused';
  createdAt: Timestamp;
  completedAt?: Timestamp;
}
```

#### Implementation: Analytics Service
```typescript
// AnalyticsService.ts
export class AnalyticsService {
  private db = getFirestore();
  
  async calculateUserStatistics(userId: string): Promise<UserStatistics> {
    const sessionsQuery = query(
      collection(this.db, 'interviewSessions'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    const sessions = await getDocs(sessionsQuery);
    const sessionData = sessions.docs.map(doc => doc.data() as InterviewSession);
    
    return {
      totalSessions: sessionData.length,
      completedSessions: sessionData.filter(s => s.status === 'completed').length,
      totalPracticeTime: this.calculateTotalPracticeTime(sessionData),
      averageSessionDuration: this.calculateAverageSessionDuration(sessionData),
      averageScore: this.calculateAverageScore(sessionData),
      bestScore: this.calculateBestScore(sessionData),
      improvementRate: this.calculateImprovementRate(sessionData),
      currentStreak: await this.calculateCurrentStreak(userId),
      longestStreak: await this.calculateLongestStreak(userId),
      questionsAnswered: this.countTotalQuestions(sessionData),
      questionsByCategory: this.groupQuestionsByCategory(sessionData),
      questionsByDifficulty: this.groupQuestionsByDifficulty(sessionData),
      strongestCategories: this.identifyStrongestCategories(sessionData),
      weakestCategories: this.identifyWeakestCategories(sessionData),
      practiceTimeByWeek: this.calculateWeeklyPracticeTime(sessionData),
      scoreProgressByWeek: this.calculateWeeklyScoreProgress(sessionData),
      categoryImprovementOverTime: this.calculateCategoryImprovement(sessionData),
      percentileRank: await this.calculatePercentileRank(userId, sessionData),
      lastCalculated: serverTimestamp(),
      calculationVersion: '1.0'
    };
  }
  
  private calculateCurrentStreak(userId: string): Promise<number> {
    // Calculate consecutive days of practice
    // Implementation would check daily practice sessions
  }
  
  private calculateImprovementRate(sessions: InterviewSession[]): number {
    if (sessions.length < 2) return 0;
    
    const recentSessions = sessions.slice(0, 5);
    const olderSessions = sessions.slice(-5);
    
    const recentAverage = recentSessions.reduce((sum, s) => sum + (s.analysis?.overallScore || 0), 0) / recentSessions.length;
    const olderAverage = olderSessions.reduce((sum, s) => sum + (s.analysis?.overallScore || 0), 0) / olderSessions.length;
    
    return ((recentAverage - olderAverage) / olderAverage) * 100;
  }
  
  async updateStatistics(userId: string): Promise<void> {
    const statistics = await this.calculateUserStatistics(userId);
    const statsRef = doc(this.db, 'users', userId, 'statistics', 'current');
    await setDoc(statsRef, statistics, { merge: true });
  }
}
```

### 2.2 Analytics Dashboard UI

#### Main Dashboard Component
```typescript
// AnalyticsDashboard.tsx
export function AnalyticsDashboard({ userId }: { userId: string }) {
  const [statistics, setStatistics] = useState<UserStatistics | null>(null);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [loading, setLoading] = useState(true);
  
  const metrics = [
    {
      title: 'Total Sessions',
      value: statistics?.totalSessions || 0,
      change: '+12%',
      trend: 'up',
      icon: Target
    },
    {
      title: 'Average Score',
      value: `${Math.round(statistics?.averageScore || 0)}%`,
      change: `+${statistics?.improvementRate?.toFixed(1)}%`,
      trend: statistics?.improvementRate > 0 ? 'up' : 'down',
      icon: TrendingUp
    },
    {
      title: 'Practice Time',
      value: `${Math.round((statistics?.totalPracticeTime || 0) / 60)}h`,
      change: '+8%',
      trend: 'up',
      icon: Clock
    },
    {
      title: 'Current Streak',
      value: `${statistics?.currentStreak || 0} days`,
      change: statistics?.currentStreak > statistics?.longestStreak ? 'New record!' : '',
      trend: 'up',
      icon: Fire
    }
  ];
  
  return (
    <div className="gi-analytics-dashboard">
      <div className="gi-dashboard-header">
        <h1>Your Progress</h1>
        <div className="gi-time-range-selector">
          {['week', 'month', 'quarter', 'year'].map(range => (
            <button
              key={range}
              onClick={() => setTimeRange(range as any)}
              className={`gi-time-button ${timeRange === range ? 'active' : ''}`}
            >
              {range.charAt(0).toUpperCase() + range.slice(1)}
            </button>
          ))}
        </div>
      </div>
      
      <div className="gi-metrics-grid">
        {metrics.map((metric, index) => (
          <MetricCard key={index} {...metric} />
        ))}
      </div>
      
      <div className="gi-charts-grid">
        <div className="gi-chart-section">
          <h2>Score Progress</h2>
          <ScoreProgressChart data={statistics?.scoreProgressByWeek || []} />
        </div>
        
        <div className="gi-chart-section">
          <h2>Practice Time</h2>
          <PracticeTimeChart data={statistics?.practiceTimeByWeek || []} />
        </div>
        
        <div className="gi-chart-section">
          <h2>Category Performance</h2>
          <CategoryPerformanceChart data={statistics?.questionsByCategory || {}} />
        </div>
        
        <div className="gi-chart-section">
          <h2>Improvement Areas</h2>
          <ImprovementAreasChart 
            strengths={statistics?.strongestCategories || []}
            weaknesses={statistics?.weakestCategories || []}
          />
        </div>
      </div>
      
      <div className="gi-insights-section">
        <h2>Personalized Insights</h2>
        <InsightsPanel statistics={statistics} />
      </div>
    </div>
  );
}

// MetricCard.tsx
function MetricCard({ title, value, change, trend, icon: Icon }: MetricCardProps) {
  return (
    <div className="gi-metric-card">
      <div className="gi-metric-header">
        <span className="gi-metric-title">{title}</span>
        <Icon className="gi-metric-icon" />
      </div>
      <div className="gi-metric-value">{value}</div>
      {change && (
        <div className={`gi-metric-change ${trend}`}>
          {trend === 'up' ? <TrendingUp /> : <TrendingDown />}
          {change}
        </div>
      )}
    </div>
  );
}

// ScoreProgressChart.tsx - Using a simple charting library
function ScoreProgressChart({ data }: { data: TimeSeriesData[] }) {
  const chartData = data.map(point => ({
    date: new Date(point.date).toLocaleDateString(),
    score: point.value
  }));
  
  return (
    <div className="gi-chart-container">
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis domain={[0, 100]} />
          <Tooltip />
          <Line 
            type="monotone" 
            dataKey="score" 
            stroke="#8884d8" 
            strokeWidth={2}
            dot={{ fill: '#8884d8' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
```

### 2.3 Goal Setting & Tracking

#### Goal Management System
```typescript
// GoalService.ts
export class GoalService {
  private db = getFirestore();
  
  async createGoal(userId: string, goalData: Omit<UserGoal, 'id' | 'userId' | 'currentValue' | 'status' | 'createdAt'>): Promise<string> {
    const goalRef = doc(collection(this.db, 'users', userId, 'goals'));
    const goal: UserGoal = {
      id: goalRef.id,
      userId,
      currentValue: 0,
      status: 'active',
      createdAt: serverTimestamp(),
      ...goalData
    };
    
    await setDoc(goalRef, goal);
    return goalRef.id;
  }
  
  async updateGoalProgress(userId: string, goalId: string, newValue: number): Promise<void> {
    const goalRef = doc(this.db, 'users', userId, 'goals', goalId);
    const goal = await getDoc(goalRef);
    
    if (goal.exists()) {
      const goalData = goal.data() as UserGoal;
      const updates: Partial<UserGoal> = {
        currentValue: newValue
      };
      
      if (newValue >= goalData.targetValue) {
        updates.status = 'completed';
        updates.completedAt = serverTimestamp();
      }
      
      await updateDoc(goalRef, updates);
    }
  }
  
  async getActiveGoals(userId: string): Promise<UserGoal[]> {
    const goalsQuery = query(
      collection(this.db, 'users', userId, 'goals'),
      where('status', '==', 'active'),
      orderBy('createdAt', 'desc')
    );
    
    const goals = await getDocs(goalsQuery);
    return goals.docs.map(doc => doc.data() as UserGoal);
  }
}

// GoalTracker.tsx
export function GoalTracker({ userId }: { userId: string }) {
  const [goals, setGoals] = useState<UserGoal[]>([]);
  const [showCreateGoal, setShowCreateGoal] = useState(false);
  
  const goalTemplates = [
    {
      type: 'practice_frequency',
      title: 'Practice 5 times this week',
      description: 'Build a consistent practice habit',
      targetValue: 5,
      duration: 7 // days
    },
    {
      type: 'score_improvement',
      title: 'Improve average score by 10%',
      description: 'Focus on interview performance',
      targetValue: 10,
      duration: 30 // days
    },
    {
      type: 'category_mastery',
      title: 'Master behavioral questions',
      description: 'Score 90%+ on 5 behavioral questions',
      targetValue: 5,
      duration: 14 // days
    },
    {
      type: 'streak_maintenance',
      title: 'Maintain 30-day practice streak',
      description: 'Practice every day for a month',
      targetValue: 30,
      duration: 30 // days
    }
  ];
  
  return (
    <div className="gi-goal-tracker">
      <div className="gi-goals-header">
        <h2>Your Goals</h2>
        <Button 
          onClick={() => setShowCreateGoal(true)}
          variant="primary"
          size="sm"
        >
          Set New Goal
        </Button>
      </div>
      
      <div className="gi-goals-list">
        {goals.map(goal => (
          <GoalCard key={goal.id} goal={goal} />
        ))}
        
        {goals.length === 0 && (
          <div className="gi-empty-goals">
            <Target className="gi-empty-icon" />
            <h3>No active goals</h3>
            <p>Set your first goal to track your progress and stay motivated!</p>
            <Button onClick={() => setShowCreateGoal(true)}>Set Your First Goal</Button>
          </div>
        )}
      </div>
      
      {showCreateGoal && (
        <CreateGoalModal
          templates={goalTemplates}
          onGoalCreate={handleGoalCreate}
          onClose={() => setShowCreateGoal(false)}
        />
      )}
    </div>
  );
}

// GoalCard.tsx
function GoalCard({ goal }: { goal: UserGoal }) {
  const progress = Math.min((goal.currentValue / goal.targetValue) * 100, 100);
  const isCompleted = goal.status === 'completed';
  
  return (
    <div className={`gi-goal-card ${isCompleted ? 'completed' : ''}`}>
      <div className="gi-goal-content">
        <div className="gi-goal-header">
          <h3>{goal.title}</h3>
          {isCompleted && <CheckCircle className="gi-completed-icon" />}
        </div>
        <p className="gi-goal-description">{goal.description}</p>
        
        <div className="gi-goal-progress">
          <div className="gi-progress-bar">
            <div 
              className="gi-progress-fill" 
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="gi-progress-text">
            {goal.currentValue} / {goal.targetValue}
          </span>
        </div>
        
        <div className="gi-goal-footer">
          <span className="gi-goal-deadline">
            Due: {new Date(goal.targetDate.toDate()).toLocaleDateString()}
          </span>
          <span className={`gi-goal-status ${goal.status}`}>
            {goal.status.replace('_', ' ')}
          </span>
        </div>
      </div>
    </div>
  );
}
```

---

## Feature 3: Gamification & Engagement System

### 3.1 Achievement Badges System

#### Badge Definition & Management
```typescript
// Badge system types
interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string; // emoji or icon name
  category: 'milestone' | 'streak' | 'performance' | 'social' | 'special';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  criteria: BadgeCriteria;
  rewardPoints: number;
  unlockMessage: string;
}

interface BadgeCriteria {
  type: 'session_count' | 'streak_days' | 'score_threshold' | 'category_mastery' | 'time_practiced' | 'special_event';
  threshold: number;
  category?: string; // for category-specific badges
  timeframe?: number; // days, for time-bound criteria
}

interface UserBadge {
  badgeId: string;
  userId: string;
  earnedAt: Timestamp;
  progress?: number; // for partially completed badges
}

// Predefined badges
const BADGES: Badge[] = [
  // Milestone Badges
  {
    id: 'first_interview',
    name: 'Getting Started',
    description: 'Complete your first interview session',
    icon: '🎯',
    category: 'milestone',
    rarity: 'common',
    criteria: { type: 'session_count', threshold: 1 },
    rewardPoints: 10,
    unlockMessage: 'Great job completing your first interview! You\'re on your way to success.'
  },
  {
    id: 'sessions_10',
    name: 'Dedicated Learner',
    description: 'Complete 10 interview sessions',
    icon: '📚',
    category: 'milestone',
    rarity: 'common',
    criteria: { type: 'session_count', threshold: 10 },
    rewardPoints: 50,
    unlockMessage: 'You\'re building great practice habits!'
  },
  {
    id: 'sessions_50',
    name: 'Interview Veteran',
    description: 'Complete 50 interview sessions',
    icon: '🏆',
    category: 'milestone',
    rarity: 'rare',
    criteria: { type: 'session_count', threshold: 50 },
    rewardPoints: 200,
    unlockMessage: 'Impressive dedication! You\'re becoming an interview expert.'
  },
  
  // Streak Badges
  {
    id: 'streak_7',
    name: 'Week Warrior',
    description: 'Practice for 7 consecutive days',
    icon: '🔥',
    category: 'streak',
    rarity: 'common',
    criteria: { type: 'streak_days', threshold: 7 },
    rewardPoints: 30,
    unlockMessage: 'One week of consistent practice! Keep the momentum going.'
  },
  {
    id: 'streak_30',
    name: 'Monthly Master',
    description: 'Practice for 30 consecutive days',
    icon: '🌟',
    category: 'streak',
    rarity: 'epic',
    criteria: { type: 'streak_days', threshold: 30 },
    rewardPoints: 150,
    unlockMessage: 'Outstanding commitment! A month of daily practice is exceptional.'
  },
  
  // Performance Badges
  {
    id: 'perfect_score',
    name: 'Flawless Performance',
    description: 'Achieve a perfect 100% score',
    icon: '⭐',
    category: 'performance',
    rarity: 'rare',
    criteria: { type: 'score_threshold', threshold: 100 },
    rewardPoints: 100,
    unlockMessage: 'Perfect! You nailed that interview completely.'
  },
  {
    id: 'behavioral_master',
    name: 'Behavioral Expert',
    description: 'Score 90%+ on 10 behavioral questions',
    icon: '🎭',
    category: 'performance',
    rarity: 'rare',
    criteria: { type: 'category_mastery', threshold: 10, category: 'behavioral' },
    rewardPoints: 80,
    unlockMessage: 'You\'ve mastered behavioral interviews! Stories are your strength.'
  },
  
  // Time-based Badges
  {
    id: 'marathon_session',
    name: 'Marathon Interviewer',
    description: 'Practice for 2+ hours in a single day',
    icon: '⏰',
    category: 'milestone',
    rarity: 'rare',
    criteria: { type: 'time_practiced', threshold: 120, timeframe: 1 },
    rewardPoints: 75,
    unlockMessage: 'Incredible dedication! You put in serious practice time today.'
  }
];

// BadgeService.ts
export class BadgeService {
  private db = getFirestore();
  
  async checkAndAwardBadges(userId: string, statistics: UserStatistics): Promise<UserBadge[]> {
    const userBadges = await this.getUserBadges(userId);
    const earnedBadgeIds = new Set(userBadges.map(ub => ub.badgeId));
    const newBadges: UserBadge[] = [];
    
    for (const badge of BADGES) {
      if (earnedBadgeIds.has(badge.id)) continue;
      
      if (this.checkBadgeCriteria(badge, statistics)) {
        const userBadge: UserBadge = {
          badgeId: badge.id,
          userId,
          earnedAt: serverTimestamp()
        };
        
        await this.awardBadge(userBadge);
        newBadges.push(userBadge);
      }
    }
    
    return newBadges;
  }
  
  private checkBadgeCriteria(badge: Badge, statistics: UserStatistics): boolean {
    switch (badge.criteria.type) {
      case 'session_count':
        return statistics.completedSessions >= badge.criteria.threshold;
      
      case 'streak_days':
        return statistics.currentStreak >= badge.criteria.threshold;
      
      case 'score_threshold':
        return statistics.bestScore >= badge.criteria.threshold;
      
      case 'category_mastery':
        const categoryCount = statistics.questionsByCategory[badge.criteria.category!] || 0;
        return categoryCount >= badge.criteria.threshold;
      
      case 'time_practiced':
        return statistics.totalPracticeTime >= badge.criteria.threshold;
      
      default:
        return false;
    }
  }
  
  private async awardBadge(userBadge: UserBadge): Promise<void> {
    const badgeRef = doc(collection(this.db, 'users', userBadge.userId, 'badges'));
    await setDoc(badgeRef, userBadge);
    
    // Trigger notification
    await this.sendBadgeNotification(userBadge);
  }
  
  private async sendBadgeNotification(userBadge: UserBadge): Promise<void> {
    const badge = BADGES.find(b => b.id === userBadge.badgeId);
    if (!badge) return;
    
    // Add to user's notification queue
    const notificationRef = doc(collection(this.db, 'users', userBadge.userId, 'notifications'));
    await setDoc(notificationRef, {
      type: 'badge_earned',
      title: `Badge Unlocked: ${badge.name}`,
      message: badge.unlockMessage,
      badgeId: badge.id,
      points: badge.rewardPoints,
      read: false,
      createdAt: serverTimestamp()
    });
  }
}
```

### 3.2 Daily Challenges System

#### Challenge Framework
```typescript
// Daily challenge types
interface DailyChallenge {
  id: string;
  date: string; // YYYY-MM-DD
  type: 'quick_practice' | 'category_focus' | 'time_challenge' | 'streak_challenge';
  title: string;
  description: string;
  instructions: string;
  requirements: ChallengeRequirements;
  rewards: ChallengeRewards;
  difficulty: 'easy' | 'medium' | 'hard';
  estimatedTime: number; // minutes
  expiresAt: Timestamp;
}

interface ChallengeRequirements {
  sessionCount?: number;
  category?: string;
  minimumScore?: number;
  timeLimit?: number; // minutes
  questionCount?: number;
}

interface ChallengeRewards {
  points: number;
  badges?: string[];
  specialMessage?: string;
}

interface UserChallengeProgress {
  challengeId: string;
  userId: string;
  startedAt?: Timestamp;
  completedAt?: Timestamp;
  progress: number; // 0-100
  status: 'available' | 'in_progress' | 'completed' | 'expired';
  sessionIds: string[]; // sessions that count toward this challenge
}

// Challenge templates for automatic generation
const CHALLENGE_TEMPLATES = [
  {
    type: 'quick_practice',
    variants: [
      {
        title: 'Lightning Round',
        description: 'Complete a 15-minute interview session',
        instructions: 'Practice efficiently! Answer 5 questions in 15 minutes or less.',
        requirements: { questionCount: 5, timeLimit: 15 },
        rewards: { points: 25 },
        difficulty: 'easy',
        estimatedTime: 15
      },
      {
        title: 'Power Session',
        description: 'Complete a full 30-minute interview',
        instructions: 'Go for depth! Complete a comprehensive interview session.',
        requirements: { sessionCount: 1, timeLimit: 30 },
        rewards: { points: 50 },
        difficulty: 'medium',
        estimatedTime: 30
      }
    ]
  },
  {
    type: 'category_focus',
    variants: [
      {
        title: 'Behavioral Focus',
        description: 'Master behavioral questions today',
        instructions: 'Answer 3 behavioral questions with 80%+ score',
        requirements: { category: 'behavioral', questionCount: 3, minimumScore: 80 },
        rewards: { points: 40 },
        difficulty: 'medium',
        estimatedTime: 20
      },
      {
        title: 'Technical Deep Dive',
        description: 'Tackle technical challenges',
        instructions: 'Complete 5 technical questions with 70%+ average score',
        requirements: { category: 'technical', questionCount: 5, minimumScore: 70 },
        rewards: { points: 60 },
        difficulty: 'hard',
        estimatedTime: 35
      }
    ]
  },
  {
    type: 'streak_challenge',
    variants: [
      {
        title: 'Keep the Streak',
        description: 'Don\'t break your practice streak!',
        instructions: 'Complete at least one question today to maintain your streak',
        requirements: { questionCount: 1 },
        rewards: { points: 15 },
        difficulty: 'easy',
        estimatedTime: 10
      }
    ]
  }
];

// ChallengeService.ts
export class ChallengeService {
  private db = getFirestore();
  
  async generateDailyChallenge(date: string): Promise<DailyChallenge> {
    // Select random template and variant
    const template = CHALLENGE_TEMPLATES[Math.floor(Math.random() * CHALLENGE_TEMPLATES.length)];
    const variant = template.variants[Math.floor(Math.random() * template.variants.length)];
    
    const challenge: DailyChallenge = {
      id: `${date}-${template.type}`,
      date,
      type: template.type,
      ...variant,
      expiresAt: Timestamp.fromDate(new Date(`${date}T23:59:59`))
    };
    
    const challengeRef = doc(this.db, 'dailyChallenges', challenge.id);
    await setDoc(challengeRef, challenge);
    
    return challenge;
  }
  
  async getUserChallengeProgress(userId: string, challengeId: string): Promise<UserChallengeProgress | null> {
    const progressRef = doc(this.db, 'users', userId, 'challengeProgress', challengeId);
    const progressSnap = await getDoc(progressRef);
    return progressSnap.exists() ? progressSnap.data() as UserChallengeProgress : null;
  }
  
  async updateChallengeProgress(userId: string, challengeId: string, sessionId: string): Promise<void> {
    const challenge = await this.getDailyChallenge(challengeId);
    if (!challenge) return;
    
    const progressRef = doc(this.db, 'users', userId, 'challengeProgress', challengeId);
    let progress = await this.getUserChallengeProgress(userId, challengeId);
    
    if (!progress) {
      progress = {
        challengeId,
        userId,
        startedAt: serverTimestamp(),
        progress: 0,
        status: 'in_progress',
        sessionIds: []
      };
    }
    
    // Update progress based on challenge requirements
    const updatedProgress = this.calculateProgress(challenge, progress, sessionId);
    
    if (updatedProgress.progress >= 100) {
      updatedProgress.status = 'completed';
      updatedProgress.completedAt = serverTimestamp();
      
      // Award rewards
      await this.awardChallengeRewards(userId, challenge);
    }
    
    await setDoc(progressRef, updatedProgress);
  }
  
  private calculateProgress(challenge: DailyChallenge, progress: UserChallengeProgress, sessionId: string): UserChallengeProgress {
    const sessionIds = [...progress.sessionIds, sessionId];
    
    switch (challenge.type) {
      case 'quick_practice':
        if (challenge.requirements.sessionCount) {
          const completedSessions = sessionIds.length;
          return {
            ...progress,
            sessionIds,
            progress: Math.min((completedSessions / challenge.requirements.sessionCount) * 100, 100)
          };
        }
        break;
      
      // Add other challenge type calculations
    }
    
    return { ...progress, sessionIds };
  }
}
```

### 3.3 Progress Levels & Rewards

#### Level System Implementation
```typescript
// User level system
interface UserLevel {
  level: number;
  currentXP: number;
  xpToNextLevel: number;
  totalXP: number;
  title: string;
  benefits: string[];
  unlockedFeatures: string[];
}

interface XPSource {
  action: string;
  points: number;
  multiplier?: number;
}

const XP_SOURCES: XPSource[] = [
  { action: 'complete_session', points: 50 },
  { action: 'perfect_score', points: 100 },
  { action: 'daily_challenge', points: 25 },
  { action: 'weekly_streak', points: 75 },
  { action: 'badge_earned', points: 30 },
  { action: 'first_session_of_day', points: 15 },
  { action: 'category_improvement', points: 40 }
];

const LEVEL_THRESHOLDS = [
  { level: 1, xpRequired: 0, title: 'Newcomer', benefits: ['Basic interview practice'] },
  { level: 2, xpRequired: 100, title: 'Learner', benefits: ['Analytics dashboard'] },
  { level: 3, xpRequired: 300, title: 'Practitioner', benefits: ['Advanced feedback'] },
  { level: 4, xpRequired: 600, title: 'Improver', benefits: ['Goal setting'] },
  { level: 5, xpRequired: 1000, title: 'Dedicated', benefits: ['Badge collection'] },
  { level: 6, xpRequired: 1500, title: 'Skilled', benefits: ['Challenge mode'] },
  { level: 7, xpRequired: 2200, title: 'Expert', benefits: ['Peer practice access'] },
  { level: 8, xpRequired: 3000, title: 'Master', benefits: ['Expert session discounts'] },
  { level: 9, xpRequired: 4000, title: 'Veteran', benefits: ['Custom challenges'] },
  { level: 10, xpRequired: 5500, title: 'Interview Guru', benefits: ['All features unlocked', 'Special recognition'] }
];

// LevelService.ts
export class LevelService {
  private db = getFirestore();
  
  async awardXP(userId: string, action: string, amount?: number): Promise<number> {
    const xpSource = XP_SOURCES.find(source => source.action === action);
    const points = amount || xpSource?.points || 0;
    
    if (points === 0) return 0;
    
    const userRef = doc(this.db, 'users', userId, 'statistics', 'current');
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) return 0;
    
    const currentXP = userSnap.data().totalXP || 0;
    const newTotalXP = currentXP + points;
    
    const currentLevel = this.calculateLevel(currentXP);
    const newLevel = this.calculateLevel(newTotalXP);
    
    // Update XP
    await updateDoc(userRef, {
      totalXP: newTotalXP,
      lastXPGained: points,
      lastXPSource: action,
      lastXPAt: serverTimestamp()
    });
    
    // Check for level up
    if (newLevel.level > currentLevel.level) {
      await this.handleLevelUp(userId, currentLevel, newLevel);
    }
    
    return points;
  }
  
  private calculateLevel(totalXP: number): UserLevel {
    let currentLevel = LEVEL_THRESHOLDS[0];
    
    for (const threshold of LEVEL_THRESHOLDS) {
      if (totalXP >= threshold.xpRequired) {
        currentLevel = threshold;
      } else {
        break;
      }
    }
    
    const nextLevelIndex = LEVEL_THRESHOLDS.findIndex(t => t.level === currentLevel.level) + 1;
    const nextLevel = LEVEL_THRESHOLDS[nextLevelIndex];
    
    return {
      level: currentLevel.level,
      currentXP: totalXP - currentLevel.xpRequired,
      xpToNextLevel: nextLevel ? nextLevel.xpRequired - totalXP : 0,
      totalXP,
      title: currentLevel.title,
      benefits: currentLevel.benefits,
      unlockedFeatures: this.getUnlockedFeatures(currentLevel.level)
    };
  }
  
  private async handleLevelUp(userId: string, oldLevel: UserLevel, newLevel: UserLevel): Promise<void> {
    // Send congratulations notification
    const notificationRef = doc(collection(this.db, 'users', userId, 'notifications'));
    await setDoc(notificationRef, {
      type: 'level_up',
      title: `Level Up! You're now a ${newLevel.title}`,
      message: `Congratulations! You've reached level ${newLevel.level}. ${newLevel.benefits.join(', ')} unlocked!`,
      level: newLevel.level,
      benefits: newLevel.benefits,
      read: false,
      createdAt: serverTimestamp()
    });
    
    // Award level-up XP bonus
    await this.awardXP(userId, 'level_up', newLevel.level * 25);
  }
  
  private getUnlockedFeatures(level: number): string[] {
    const features = [];
    if (level >= 2) features.push('analytics_dashboard');
    if (level >= 3) features.push('advanced_feedback');
    if (level >= 4) features.push('goal_setting');
    if (level >= 5) features.push('badge_collection');
    if (level >= 6) features.push('daily_challenges');
    if (level >= 7) features.push('peer_practice');
    if (level >= 8) features.push('expert_sessions');
    return features;
  }
}
```

---

## Testing Strategy

### 4.1 Unit Testing
```typescript
// ProfileService.test.ts
describe('ProfileService', () => {
  let profileService: ProfileService;
  let mockDb: any;
  
  beforeEach(() => {
    mockDb = createMockFirestore();
    profileService = new ProfileService();
  });
  
  it('should create a complete user profile with defaults', async () => {
    const uid = 'test-user-id';
    const initialData = { email: 'test@example.com', displayName: 'Test User' };
    
    await profileService.createProfile(uid, initialData);
    
    const profile = await profileService.getProfile(uid);
    expect(profile).toMatchObject({
      uid,
      email: 'test@example.com',
      displayName: 'Test User',
      subscriptionTier: 'free',
      accountStatus: 'active',
      profileVisibility: 'peers_only'
    });
  });
  
  it('should update profile and set updatedAt timestamp', async () => {
    const uid = 'test-user-id';
    await profileService.createProfile(uid, { email: 'test@example.com' });
    
    const updates = { bio: 'New bio', industry: ['technology'] };
    await profileService.updateProfile(uid, updates);
    
    const profile = await profileService.getProfile(uid);
    expect(profile?.bio).toBe('New bio');
    expect(profile?.industry).toEqual(['technology']);
    expect(profile?.updatedAt).toBeDefined();
  });
});

// AnalyticsService.test.ts
describe('AnalyticsService', () => {
  it('should calculate correct improvement rate', () => {
    const sessions = [
      { analysis: { overallScore: 90 } }, // recent
      { analysis: { overallScore: 85 } },
      { analysis: { overallScore: 80 } },
      { analysis: { overallScore: 75 } },
      { analysis: { overallScore: 70 } }, // older
    ];
    
    const service = new AnalyticsService();
    const improvement = service.calculateImprovementRate(sessions);
    
    expect(improvement).toBeCloseTo(14.29, 2); // (80-70)/70 * 100
  });
});

// BadgeService.test.ts
describe('BadgeService', () => {
  it('should award first interview badge', async () => {
    const statistics = { completedSessions: 1 } as UserStatistics;
    const badgeService = new BadgeService();
    
    const newBadges = await badgeService.checkAndAwardBadges('user-id', statistics);
    
    expect(newBadges).toHaveLength(1);
    expect(newBadges[0].badgeId).toBe('first_interview');
  });
});
```

### 4.2 Integration Testing
```typescript
// ProfileIntegration.test.ts
describe('Profile Integration', () => {
  it('should handle complete profile workflow', async () => {
    // Create user account
    const user = await createTestUser();
    
    // Create initial profile
    await profileService.createProfile(user.uid, {
      email: user.email,
      displayName: 'Test User'
    });
    
    // Update profile with professional info
    await profileService.updateProfile(user.uid, {
      currentRole: 'Software Engineer',
      targetRoles: ['Senior Software Engineer'],
      industry: ['technology']
    });
    
    // Verify profile is complete
    const profile = await profileService.getProfile(user.uid);
    expect(profile?.currentRole).toBe('Software Engineer');
    expect(profile?.targetRoles).toContain('Senior Software Engineer');
  });
});
```

### 4.3 User Acceptance Tests
```typescript
// AnalyticsDashboard.test.tsx
describe('Analytics Dashboard', () => {
  it('should display user metrics correctly', async () => {
    const mockStatistics = {
      totalSessions: 15,
      averageScore: 85,
      totalPracticeTime: 300,
      currentStreak: 7
    };
    
    render(<AnalyticsDashboard userId="test-user" />, {
      wrapper: createTestWrapper({ statistics: mockStatistics })
    });
    
    expect(screen.getByText('15')).toBeInTheDocument(); // total sessions
    expect(screen.getByText('85%')).toBeInTheDocument(); // average score
    expect(screen.getByText('5h')).toBeInTheDocument(); // practice time
    expect(screen.getByText('7 days')).toBeInTheDocument(); // streak
  });
  
  it('should allow time range selection', async () => {
    render(<AnalyticsDashboard userId="test-user" />);
    
    const monthButton = screen.getByText('Month');
    const weekButton = screen.getByText('Week');
    
    fireEvent.click(weekButton);
    expect(weekButton).toHaveClass('active');
    expect(monthButton).not.toHaveClass('active');
  });
});
```

---

## Deployment Plan

### Week 1-2: Infrastructure Setup
1. **Database Schema Migration**
   - Deploy new Firestore collection structures
   - Update security rules for enhanced profiles
   - Create indexes for analytics queries

2. **Profile System Deployment**
   - Deploy ProfileService with backward compatibility
   - Release profile creation flow for new users
   - Add profile migration for existing users

### Week 3: Analytics System
1. **Analytics Service Deployment**
   - Deploy AnalyticsService with batch processing
   - Create analytics dashboard UI components
   - Enable real-time statistics updates

2. **Goal Setting Release**
   - Deploy goal management system
   - Add goal tracking to session completion flow
   - Release goal creation UI

### Week 4: Gamification Features
1. **Badge System Launch**
   - Deploy badge awarding logic
   - Release badge display in user interface
   - Enable badge notifications

2. **Daily Challenges Release**
   - Deploy challenge generation system
   - Add challenge tracking to sessions
   - Release challenge UI components

### Rollout Strategy
- **Week 1**: 10% of users (profile system)
- **Week 2**: 25% of users (analytics dashboard)
- **Week 3**: 50% of users (full feature set)
- **Week 4**: 100% of users (complete rollout)

---

## Success Metrics & KPIs

### User Engagement Metrics
- **Profile Completion Rate**: Target 80% within first week
- **Analytics Dashboard Usage**: Target 70% weekly active usage
- **Goal Setting Adoption**: Target 40% of users create goals
- **Badge Collection Engagement**: Target 60% of users earn first badge

### Retention Impact
- **Day 7 Retention**: Improve from baseline by 15%
- **Day 30 Retention**: Improve from baseline by 20%
- **Session Frequency**: Increase average sessions per user by 25%

### Feature-Specific Metrics
- **Profile Updates**: Users update profile 2+ times per month
- **Goal Completion**: 30% of created goals are completed
- **Challenge Participation**: 50% of users attempt daily challenges
- **Badge Progression**: Users earn average 2 badges per month

---

## Risk Mitigation

### Technical Risks
1. **Database Performance**: Implement efficient indexing and query optimization
2. **User Migration**: Gradual rollout with fallback to basic profiles
3. **Analytics Load**: Use batch processing and caching for heavy calculations

### User Experience Risks
1. **Feature Overwhelm**: Progressive disclosure of advanced features
2. **Notification Fatigue**: Configurable notification preferences
3. **Gamification Balance**: Optional participation in achievement system

### Business Risks
1. **Development Velocity**: Parallel development tracks for independent features
2. **User Adoption**: Extensive user testing and feedback integration
3. **Resource Allocation**: Clear priority framework for feature development

---

This comprehensive Phase 1 plan establishes the foundational user engagement and analytics infrastructure necessary for Salamin's evolution into a competitive interview practice platform. The enhanced user profiles, detailed analytics, and gamification systems will significantly improve user retention and engagement while providing the data infrastructure needed for subsequent phases.