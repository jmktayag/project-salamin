'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Calendar, 
  Clock, 
  User, 
  Award, 
  TrendingUp, 
  TrendingDown,
  Download,
  CheckCircle2,
  AlertCircle,
  Lightbulb,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { InterviewSession } from '../types/session';
import { SessionHistoryService } from '../utils/SessionHistoryService';
import { useAuth } from '../hooks/useAuth';

interface SessionDetailModalProps {
  sessionId: string;
  isOpen: boolean;
  onClose: () => void;
  onExport: (sessionId: string) => void;
}

export function SessionDetailModal({ sessionId, isOpen, onClose, onExport }: SessionDetailModalProps) {
  const { user } = useAuth();
  const [session, setSession] = useState<InterviewSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedQuestions, setExpandedQuestions] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (isOpen && sessionId && user) {
      loadSessionDetails();
    }
  }, [isOpen, sessionId, user]);

  const loadSessionDetails = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      const sessionData = await SessionHistoryService.getSessionById(sessionId, user.uid);
      setSession(sessionData);
    } catch (err) {
      console.error('Error loading session details:', err);
      setError('Failed to load session details');
    } finally {
      setLoading(false);
    }
  };

  const toggleQuestionExpansion = (index: number) => {
    setExpandedQuestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'N/A';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${remainingSeconds}s`;
    }
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

  const getFeedbackIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      case 'suggestion':
        return <Lightbulb className="w-4 h-4 text-blue-600" />;
      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />
        
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          {/* Header */}
          <div className="bg-white px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Interview Session Details
              </h3>
              <div className="flex items-center gap-3">
                {session?.status === 'completed' && (
                  <button
                    onClick={() => onExport(sessionId)}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="bg-white rounded-md text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="bg-white px-6 py-4 max-h-[80vh] overflow-y-auto">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-sm text-gray-500">Loading session details...</p>
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <p className="text-red-600">{error}</p>
              </div>
            ) : session ? (
              <div className="space-y-6">
                {/* Session Overview */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">{session.position}</h4>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-600">
                            Started: {formatDate(session.startedAt)}
                          </span>
                        </div>
                        {session.completedAt && (
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-500" />
                            <span className="text-sm text-gray-600">
                              Completed: {formatDate(session.completedAt)}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-600">
                            Duration: {formatDuration(session.duration)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-600">
                            {session.questionsAnswered}/{session.totalQuestions} questions answered
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getTypeColor(session.interviewType)}`}>
                          {session.interviewType}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(session.status)}`}>
                          {session.status.replace('_', ' ')}
                        </span>
                      </div>
                      {session.analysis?.overallScore && (
                        <div className="bg-white rounded-lg p-4 border border-gray-200">
                          <div className="flex items-center gap-2 mb-2">
                            <Award className="w-5 h-5 text-yellow-500" />
                            <span className="font-medium text-gray-900">Overall Score</span>
                          </div>
                          <div className="text-2xl font-bold text-gray-900">
                            {session.analysis.overallScore}%
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Analysis Summary */}
                {session.analysis && (
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Interview Analysis</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <TrendingUp className="w-5 h-5 text-green-600" />
                          <h5 className="font-medium text-gray-900">Strengths</h5>
                        </div>
                        <ul className="space-y-1">
                          {session.analysis.strengths.map((strength, index) => (
                            <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                              <span className="text-green-600 mt-1">•</span>
                              <span>{strength}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <TrendingDown className="w-5 h-5 text-red-600" />
                          <h5 className="font-medium text-gray-900">Areas for Improvement</h5>
                        </div>
                        <ul className="space-y-1">
                          {session.analysis.weaknesses.map((weakness, index) => (
                            <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                              <span className="text-red-600 mt-1">•</span>
                              <span>{weakness}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="mb-4">
                      <h5 className="font-medium text-gray-900 mb-2">Recommendations</h5>
                      <ul className="space-y-1">
                        {session.analysis.recommendations.map((recommendation, index) => (
                          <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                            <span className="text-blue-600 mt-1">→</span>
                            <span>{recommendation}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                      <h5 className="font-medium text-gray-900 mb-2">Detailed Feedback</h5>
                      <p className="text-sm text-gray-600">{session.analysis.detailedFeedback}</p>
                    </div>
                  </div>
                )}

                {/* Questions and Answers */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Questions & Responses</h4>
                  <div className="space-y-4">
                    {session.questions.map((q, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg">
                        <button
                          onClick={() => toggleQuestionExpansion(index)}
                          className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium text-gray-900">
                                Question {index + 1}
                              </span>
                              <span className="px-2 py-1 rounded text-xs bg-gray-100 text-gray-600">
                                {q.category}
                              </span>
                              <span className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-600">
                                {q.difficulty}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 line-clamp-2">{q.question}</p>
                          </div>
                          {expandedQuestions.has(index) ? (
                            <ChevronUp className="w-5 h-5 text-gray-400" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-gray-400" />
                          )}
                        </button>
                        
                        {expandedQuestions.has(index) && (
                          <div className="border-t border-gray-200 p-4 bg-gray-50">
                            <div className="space-y-4">
                              <div>
                                <h6 className="text-sm font-medium text-gray-900 mb-2">Your Response</h6>
                                <p className="text-sm text-gray-600 bg-white p-3 rounded border">
                                  {q.userResponse}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  Answered on {formatDate(q.responseTimestamp)}
                                </p>
                              </div>
                              
                              {q.feedback && q.feedback.length > 0 && (
                                <div>
                                  <h6 className="text-sm font-medium text-gray-900 mb-2">AI Feedback</h6>
                                  <div className="space-y-2">
                                    {q.feedback.map((feedback, feedbackIndex) => (
                                      <div 
                                        key={feedbackIndex}
                                        className="flex items-start gap-2 text-sm bg-white p-3 rounded border"
                                      >
                                        {getFeedbackIcon(feedback.type)}
                                        <span className="text-gray-600">{feedback.text}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">Session not found</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}