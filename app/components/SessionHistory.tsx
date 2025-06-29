'use client';

import React, { useState, useEffect } from 'react';
import { 
  History, 
  Filter, 
  Search, 
  RefreshCw, 
  Calendar,
  TrendingUp,
  Clock,
  Award,
  PlayCircle,
  Zap,
  Target,
  Star
} from 'lucide-react';
import { SessionCard } from './SessionCard';
import { SessionDetailModal } from './SessionDetailModal';
import { SessionHistoryService } from '../utils/SessionHistoryService';
import { SessionSummary, SessionFilters } from '../types/session';
import { useAuth } from '../hooks/useAuth';
import { trackDashboardViewed, trackDashboardAction } from '../lib/firebase/analytics';
import { Button } from './ui/Button';

interface SessionHistoryProps {
  onViewSession: (sessionId: string) => void;
  onExportSession: (sessionId: string) => void;
  onStartNewInterview?: () => void;
}

export function SessionHistory({ onViewSession, onExportSession, onStartNewInterview }: SessionHistoryProps) {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<SessionFilters>({
    status: 'all',
    interviewType: 'all'
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalSessions: 0,
    completedSessions: 0,
    averageScore: undefined as number | undefined,
    totalInterviewTime: 0
  });

  useEffect(() => {
    if (user) {
      loadSessions();
      loadStats();
      // Track dashboard view
      trackDashboardViewed({ section: 'history' });
    }
  }, [user, filters]);

  const loadSessions = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const activeFilters = { ...filters };
      if (searchTerm) {
        activeFilters.position = searchTerm;
      }
      
      const userSessions = await SessionHistoryService.getUserSessions(
        user.uid,
        activeFilters
      );
      setSessions(userSessions);
    } catch (err) {
      console.error('Error loading sessions:', err);
      setError('Failed to load interview sessions');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    if (!user) return;
    
    try {
      const userStats = await SessionHistoryService.getUserSessionStats(user.uid);
      setStats({
        totalSessions: userStats.totalSessions,
        completedSessions: userStats.completedSessions,
        averageScore: userStats.averageScore,
        totalInterviewTime: userStats.totalInterviewTime
      });
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  };

  const handleViewSession = (sessionId: string) => {
    setSelectedSessionId(sessionId);
    trackDashboardAction({ action_type: 'view_session', section: 'history' });
    onViewSession(sessionId);
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!user) return;
    
    if (window.confirm('Are you sure you want to delete this interview session? This action cannot be undone.')) {
      try {
        await SessionHistoryService.deleteSession(sessionId, user.uid);
        setSessions(sessions.filter(s => s.id !== sessionId));
        loadStats(); // Refresh stats
        trackDashboardAction({ action_type: 'delete_session', section: 'history' });
      } catch (err) {
        console.error('Error deleting session:', err);
        setError('Failed to delete session');
      }
    }
  };

  const handleRefresh = () => {
    loadSessions();
    loadStats();
    trackDashboardAction({ action_type: 'refresh_data', section: 'history' });
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const calculateStreakDays = (sessions: SessionSummary[]) => {
    if (sessions.length === 0) return 0;
    
    const sortedSessions = [...sessions]
      .filter(s => s.status === 'completed')
      .sort((a, b) => b.startedAt - a.startedAt);
    
    if (sortedSessions.length === 0) return 0;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let streak = 0;
    let currentDate = new Date(today);
    
    for (const session of sortedSessions) {
      const sessionDate = new Date(session.startedAt);
      sessionDate.setHours(0, 0, 0, 0);
      
      if (sessionDate.getTime() === currentDate.getTime()) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else if (sessionDate.getTime() < currentDate.getTime()) {
        break;
      }
    }
    
    return streak;
  };

  const getMotivationalMessage = (stats: any, streakDays: number) => {
    if (stats.totalSessions === 0) {
      return "Welcome! Ready to start your interview journey?";
    }
    
    if (streakDays >= 7) {
      return `🔥 Amazing ${streakDays}-day streak! You're on fire!`;
    }
    
    if (streakDays >= 3) {
      return `⭐ Great momentum with ${streakDays} days in a row!`;
    }
    
    if (stats.averageScore && stats.averageScore >= 80) {
      return `🎯 Excellent performance! Average score: ${stats.averageScore}%`;
    }
    
    if (stats.completedSessions >= 5) {
      return `💪 ${stats.completedSessions} interviews completed - you're building expertise!`;
    }
    
    return "Keep practicing to improve your interview skills!";
  };

  const streakDays = calculateStreakDays(sessions);
  const motivationalMessage = getMotivationalMessage(stats, streakDays);

  const filteredSessions = sessions.filter(session => {
    if (searchTerm) {
      return session.position.toLowerCase().includes(searchTerm.toLowerCase());
    }
    return true;
  });

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-12">
          <History className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Please sign in</h3>
          <p className="mt-1 text-sm text-gray-500">
            You need to be signed in to view your interview history.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Welcome Section */}
      <div className="mb-8">
        <div className="gi-card-elevated bg-gradient-to-r from-primary to-secondary p-6 text-white mb-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
            <div className="flex-1">
              <h1 className="gi-heading-2 text-white mb-2">
                Welcome back, {user.displayName || 'Interviewer'}! 👋
              </h1>
              <p className="gi-body text-primary-100 mb-4 md:mb-0">
                {motivationalMessage}
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              {onStartNewInterview && (
                <Button
                  onClick={() => {
                    trackDashboardAction({ action_type: 'start_interview', section: 'welcome' });
                    onStartNewInterview();
                  }}
                  variant="accent"
                  size="md"
                  className="w-full sm:w-auto"
                >
                  <PlayCircle className="w-5 h-5" />
                  Start New Interview
                </Button>
              )}
              
              <Button
                onClick={handleRefresh}
                variant="ghost"
                size="md"
                disabled={loading}
                className="w-full sm:w-auto bg-primary-500 bg-opacity-20 text-white hover:bg-opacity-30 border-transparent"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </div>

        {/* Quick Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="gi-card p-4">
            <div className="flex items-center">
              <div className="p-2 bg-accent-light rounded-md">
                <Star className="w-5 h-5 text-accent-dark" />
              </div>
              <div className="ml-3">
                <p className="gi-label text-text-muted">Streak</p>
                <p className="gi-heading-3">{streakDays} days</p>
              </div>
            </div>
          </div>

          <div className="gi-card p-4">
            <div className="flex items-center">
              <div className="p-2 bg-success-50 rounded-md">
                <Target className="w-5 h-5 text-success" />
              </div>
              <div className="ml-3">
                <p className="gi-label text-text-muted">Avg Score</p>
                <p className="gi-heading-3">
                  {stats.averageScore ? `${stats.averageScore}%` : 'N/A'}
                </p>
              </div>
            </div>
          </div>

          <div className="gi-card p-4">
            <div className="flex items-center">
              <div className="p-2 bg-primary-100 rounded-md">
                <Calendar className="w-5 h-5 text-primary" />
              </div>
              <div className="ml-3">
                <p className="gi-label text-text-muted">Sessions</p>
                <p className="gi-heading-3">{stats.totalSessions}</p>
              </div>
            </div>
          </div>

          <div className="gi-card p-4">
            <div className="flex items-center">
              <div className="p-2 bg-warning-50 rounded-md">
                <Clock className="w-5 h-5 text-warning" />
              </div>
              <div className="ml-3">
                <p className="gi-label text-text-muted">Time</p>
                <p className="gi-heading-3">
                  {formatTime(stats.totalInterviewTime)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="gi-heading-2">Your Interview History</h2>
            <p className="gi-body-small mt-1">
              Review your past interview sessions and track your progress
            </p>
          </div>
        </div>


        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted w-4 h-4" />
            <input
              type="text"
              placeholder="Search by position..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="gi-textarea w-full pl-10 pr-4 py-2"
            />
          </div>
          
          <Button
            onClick={() => setShowFilters(!showFilters)}
            variant="outline"
            size="md"
          >
            <Filter className="w-4 h-4" />
            Filters
          </Button>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="gi-card p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="gi-label block mb-2">
                  Status
                </label>
                <select
                  value={filters.status || 'all'}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value as any })}
                  className="gi-textarea w-full px-3 py-2"
                >
                  <option value="all">All Statuses</option>
                  <option value="completed">Completed</option>
                  <option value="in_progress">In Progress</option>
                  <option value="abandoned">Abandoned</option>
                </select>
              </div>

              <div>
                <label className="gi-label block mb-2">
                  Interview Type
                </label>
                <select
                  value={filters.interviewType || 'all'}
                  onChange={(e) => setFilters({ ...filters, interviewType: e.target.value as any })}
                  className="gi-textarea w-full px-3 py-2"
                >
                  <option value="all">All Types</option>
                  <option value="behavioral">Behavioral</option>
                  <option value="technical">Technical</option>
                  <option value="mixed">Mixed</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="gi-card gi-status-error mb-6 p-4">
          <p className="gi-body-small">{error}</p>
        </div>
      )}

      {/* Sessions List */}
      {loading ? (
        <div className="text-center py-12">
          <RefreshCw className="mx-auto h-8 w-8 animate-spin text-gray-400" />
          <p className="mt-2 text-sm text-gray-500">Loading interview sessions...</p>
        </div>
      ) : filteredSessions.length === 0 ? (
        <div className="text-center py-12">
          <History className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No interview sessions found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm || filters.status !== 'all' || filters.interviewType !== 'all'
              ? 'Try adjusting your search criteria'
              : 'Start your first interview to see your history here'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredSessions.map((session) => (
            <SessionCard
              key={session.id}
              session={session}
              onView={handleViewSession}
              onDelete={handleDeleteSession}
              onExport={onExportSession}
            />
          ))}
        </div>
      )}

      {/* Session Detail Modal */}
      {selectedSessionId && (
        <SessionDetailModal
          sessionId={selectedSessionId}
          isOpen={!!selectedSessionId}
          onClose={() => setSelectedSessionId(null)}
          onExport={onExportSession}
        />
      )}
    </div>
  );
}