import { logEvent } from 'firebase/analytics';
import { getAnalyticsInstance } from './config';
import { 
  AnalyticsEvent, 
  SessionStartedEvent, 
  QuestionAnsweredEvent, 
  SessionCompletedEvent, 
  FeatureUsedEvent, 
  SessionAbandonedEvent 
} from './types';

const isDevelopment = process.env.NODE_ENV === 'development';

function logAnalyticsEvent(event: AnalyticsEvent): void {
  // Disable analytics completely in development mode, only log to console
  if (isDevelopment) {
    console.log('[Analytics - Dev Mode - Not Sent]', event.event_name, event);
    return;
  }

  const analytics = getAnalyticsInstance();
  
  if (!analytics) {
    console.warn('[Analytics - Production] Firebase not initialized, event not logged:', event.event_name);
    return;
  }

  try {
    // Extract event name and remove it from parameters
    const { event_name, ...parameters } = event;
    
    logEvent(analytics, event_name, parameters);
    console.log('[Analytics - Sent]', event_name, parameters);
  } catch (error) {
    console.warn('Analytics event logging failed:', error);
  }
}

export function trackSessionStarted(data: Omit<SessionStartedEvent, 'event_name' | 'timestamp'>): void {
  logAnalyticsEvent({
    event_name: 'session_started',
    timestamp: Date.now(),
    ...data
  });
}

export function trackQuestionAnswered(data: Omit<QuestionAnsweredEvent, 'event_name' | 'timestamp'>): void {
  logAnalyticsEvent({
    event_name: 'question_answered',
    timestamp: Date.now(),
    ...data
  });
}

export function trackSessionCompleted(data: Omit<SessionCompletedEvent, 'event_name' | 'timestamp'>): void {
  logAnalyticsEvent({
    event_name: 'session_completed',
    timestamp: Date.now(),
    ...data
  });
}

export function trackFeatureUsed(data: Omit<FeatureUsedEvent, 'event_name' | 'timestamp'>): void {
  logAnalyticsEvent({
    event_name: 'feature_used',
    timestamp: Date.now(),
    ...data
  });
}

export function trackSessionAbandoned(data: Omit<SessionAbandonedEvent, 'event_name' | 'timestamp'>): void {
  logAnalyticsEvent({
    event_name: 'session_abandoned',
    timestamp: Date.now(),
    ...data
  });
}