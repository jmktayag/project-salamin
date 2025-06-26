export interface SessionStartedEvent {
  event_name: 'session_started';
  job_position?: string;
  interview_type?: string;
  timestamp: number;
}

export interface QuestionAnsweredEvent {
  event_name: 'question_answered';
  question_index: number;
  question_category?: string;
  response_length?: number;
  timestamp: number;
}

export interface SessionCompletedEvent {
  event_name: 'session_completed';
  total_questions: number;
  duration_seconds: number;
  completion_rate: number;
  timestamp: number;
}

export interface FeatureUsedEvent {
  event_name: 'feature_used';
  feature_type: 'tts' | 'speech_recognition' | 'hint_panel' | 'feedback_view';
  feature_context?: string;
  timestamp: number;
}

export interface SessionAbandonedEvent {
  event_name: 'session_abandoned';
  questions_completed: number;
  abandonment_point: 'configuration' | 'interview' | 'feedback';
  duration_seconds: number;
  timestamp: number;
}

export interface UserSignedInEvent {
  event_name: 'user_signed_in';
  auth_method: 'email' | 'google';
  is_new_user?: boolean;
  timestamp: number;
}

export interface UserSignedUpEvent {
  event_name: 'user_signed_up';
  auth_method: 'email' | 'google';
  timestamp: number;
}

export interface UserSignedOutEvent {
  event_name: 'user_signed_out';
  session_duration_seconds?: number;
  timestamp: number;
}

export type AnalyticsEvent = 
  | SessionStartedEvent
  | QuestionAnsweredEvent
  | SessionCompletedEvent
  | FeatureUsedEvent
  | SessionAbandonedEvent
  | UserSignedInEvent
  | UserSignedUpEvent
  | UserSignedOutEvent;

export interface AnalyticsContext {
  isEnabled: boolean;
  isDevelopment: boolean;
}