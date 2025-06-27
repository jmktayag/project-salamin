import { InterviewType } from './interview';

export interface SessionQuestion {
  question: string;
  category: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  userResponse: string;
  responseTimestamp: number;
  feedback?: SessionFeedback[];
}

export interface SessionFeedback {
  type: 'success' | 'warning' | 'suggestion';
  text: string;
}

export interface SessionAnalysis {
  overallScore: number;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  hiringVerdict: 'Strong Hire' | 'Hire' | 'Weak Hire' | 'No Hire';
  detailedFeedback: string;
}

export interface InterviewSession {
  id: string;
  userId: string;
  position: string;
  interviewType: InterviewType;
  status: 'in_progress' | 'completed' | 'abandoned';
  startedAt: number;
  completedAt?: number;
  duration?: number; // in seconds
  questions: SessionQuestion[];
  analysis?: SessionAnalysis;
  questionsAnswered: number;
  totalQuestions: number;
  createdAt: number;
  updatedAt: number;
}

export interface SessionSummary {
  id: string;
  position: string;
  interviewType: InterviewType;
  status: 'in_progress' | 'completed' | 'abandoned';
  startedAt: number;
  completedAt?: number;
  duration?: number;
  questionsAnswered: number;
  totalQuestions: number;
  overallScore?: number;
}

export interface SessionFilters {
  status?: 'in_progress' | 'completed' | 'abandoned' | 'all';
  interviewType?: InterviewType | 'all';
  dateRange?: {
    start: number;
    end: number;
  };
  position?: string;
}

export interface SessionExportData {
  session: InterviewSession;
  exportedAt: number;
  exportFormat: 'json' | 'pdf';
}