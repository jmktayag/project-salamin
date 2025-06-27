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
  Award
} from 'lucide-react';
import { SessionCard } from './SessionCard';
import { SessionDetailModal } from './SessionDetailModal';
import { SessionHistoryService } from '../utils/SessionHistoryService';
import { SessionSummary, SessionFilters } from '../types/session';
import { useAuth } from '../hooks/useAuth';

interface SessionHistoryProps {
  onViewSession: (sessionId: string) => void;
  onExportSession: (sessionId: string) => void;
}

export function SessionHistory({ onViewSession, onExportSession }: SessionHistoryProps) {
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
    onViewSession(sessionId);
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!user) return;
    
    if (window.confirm('Are you sure you want to delete this interview session? This action cannot be undone.')) {
      try {
        await SessionHistoryService.deleteSession(sessionId, user.uid);
        setSessions(sessions.filter(s => s.id !== sessionId));
        loadStats(); // Refresh stats
      } catch (err) {
        console.error('Error deleting session:', err);
        setError('Failed to delete session');
      }
    }
  };

  const handleRefresh = () => {
    loadSessions();
    loadStats();
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

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
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Interview History</h1>
            <p className="mt-1 text-sm text-gray-500">
              Review your past interview sessions and track your progress
            </p>
          </div>
          
          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-md">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Total Sessions</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalSessions}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-md">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Completed</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.completedSessions}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-md">
                <Award className="w-5 h-5 text-purple-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Avg Score</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats.averageScore ? `${stats.averageScore}%` : 'N/A'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-md">
                <Clock className="w-5 h-5 text-orange-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Total Time</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {formatTime(stats.totalInterviewTime)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by position..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={filters.status || 'all'}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Statuses</option>
                  <option value="completed">Completed</option>
                  <option value="in_progress">In Progress</option>
                  <option value="abandoned">Abandoned</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Interview Type
                </label>
                <select
                  value={filters.interviewType || 'all'}
                  onChange={(e) => setFilters({ ...filters, interviewType: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
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