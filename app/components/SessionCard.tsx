'use client';

import React from 'react';
import { 
  Calendar, 
  Clock, 
  User, 
  CheckCircle2, 
  XCircle, 
  PlayCircle,
  MoreVertical,
  Trash2,
  Eye,
  Download
} from 'lucide-react';
import { SessionSummary } from '../types/session';

interface SessionCardProps {
  session: SessionSummary;
  onView: (sessionId: string) => void;
  onDelete: (sessionId: string) => void;
  onExport: (sessionId: string) => void;
}

export function SessionCard({ session, onView, onDelete, onExport }: SessionCardProps) {
  const [showActions, setShowActions] = React.useState(false);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'N/A';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-50';
      case 'abandoned':
        return 'text-red-600 bg-red-50';
      case 'in_progress':
        return 'text-blue-600 bg-blue-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'abandoned':
        return <XCircle className="w-4 h-4" />;
      case 'in_progress':
        return <PlayCircle className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'technical':
        return 'bg-purple-100 text-purple-800';
      case 'behavioral':
        return 'bg-blue-100 text-blue-800';
      case 'mixed':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {session.position}
            </h3>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(session.interviewType)}`}>
              {session.interviewType}
            </span>
          </div>
          
          <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>{formatDate(session.startedAt)}</span>
            </div>
            
            {session.duration && (
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{formatDuration(session.duration)}</span>
              </div>
            )}
            
            <div className="flex items-center gap-1">
              <User className="w-4 h-4" />
              <span>{session.questionsAnswered}/{session.totalQuestions} questions</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(session.status)}`}>
              {getStatusIcon(session.status)}
              <span className="capitalize">{session.status.replace('_', ' ')}</span>
            </div>
            
            {session.overallScore && (
              <div className="text-sm font-semibold text-gray-900">
                Score: {session.overallScore}%
              </div>
            )}
          </div>
        </div>

        <div className="relative">
          <button
            onClick={() => setShowActions(!showActions)}
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
            aria-label="Session actions"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {showActions && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-10">
              <button
                onClick={() => {
                  onView(session.id);
                  setShowActions(false);
                }}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <Eye className="w-4 h-4 mr-2" />
                View Details
              </button>
              
              {session.status === 'completed' && (
                <button
                  onClick={() => {
                    onExport(session.id);
                    setShowActions(false);
                  }}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export Session
                </button>
              )}
              
              <button
                onClick={() => {
                  onDelete(session.id);
                  setShowActions(false);
                }}
                className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Session
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Click to view details */}
      <button
        onClick={() => onView(session.id)}
        className="w-full text-left p-3 -m-3 rounded-md hover:bg-gray-50 transition-colors"
        aria-label={`View details for ${session.position} interview`}
      >
        <div className="text-xs text-gray-500">
          Click to view full interview details and feedback
        </div>
      </button>
    </div>
  );
}