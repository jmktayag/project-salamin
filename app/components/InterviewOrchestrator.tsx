'use client';

import React, { useRef, useState, useMemo, useCallback } from 'react';
import { useNavigation } from './navigation/NavigationProvider';

// Question count constants
const QUESTION_COUNT = {
  DEVELOPMENT: 1,
  PRODUCTION: 5,
} as const;

import {
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  Mic,
  Volume2,
  VolumeX,
  CheckCircle,
  Lightbulb,
} from 'lucide-react';
import { InterviewQuestion, getFallbackQuestions } from '../data/interviewQuestions';
import { TextToSpeechService } from '../utils/TextToSpeechService';
import { InterviewFeedbackService } from '../utils/InterviewFeedbackService';
import { QuestionGenerator } from '../utils/QuestionGenerator';
import { InterviewSummary } from './InterviewSummary';
import { SessionHistory } from './SessionHistory';
import { SessionHistoryService } from '../utils/SessionHistoryService';
import LandingPage from './LandingPage';
import { SessionExportService } from '../utils/SessionExportService';
import { FirestoreConnectionTest } from '../utils/FirestoreConnectionTest';
import { useAuth } from '../hooks/useAuth';
import { InterviewAnalysisService, InterviewAnalysis } from '../utils/InterviewAnalysisService';
import { IntegratedSpeechService, IntegratedSpeechCallbacks } from '../utils/IntegratedSpeechService';
import { VoiceStatus, TranscriptionError } from '../types/speech';
import InterviewConfiguration from './InterviewConfiguration';
import { InterviewConfiguration as IInterviewConfiguration } from '../types/interview';
import { useFloatingHint } from '../hooks/useFloatingHint';
import { HintButton } from './HintButton';
import { FloatingHintPanel } from './FloatingHintPanel';
import { 
  trackSessionStarted, 
  trackQuestionAnswered, 
  trackSessionCompleted, 
  trackFeatureUsed, 
  trackSessionAbandoned 
} from '../lib/firebase/analytics';

/**
 * Types of feedback that can be displayed to the user
 */
type FeedbackType = 'success' | 'warning' | 'suggestion';

/**
 * Structure for feedback items displayed to the user
 */
interface FeedbackItem {
  /** Type of feedback (success, warning, or info) */
  type: FeedbackType;
  /** Feedback message text */
  text: string;
}

/**
 * Web Speech API type definitions for TypeScript (fallback support)
 */
interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionInterface extends EventTarget {
  lang: string;
  interimResults: boolean;
  onresult: (event: SpeechRecognitionEvent) => void;
  onend: () => void;
  onerror: (event: Event) => void;
  onstart: () => void;
  start: () => void;
  stop: () => void;
}

/**
 * Sample feedback items for demonstration purposes
 */
const SAMPLE_FEEDBACK = [
  {
    type: 'success' as const,
    text: 'Good structure in your response with a clear problem statement.',
  },
  {
    type: 'warning' as const,
    text: 'Consider adding more specific details about the outcomes achieved.',
  },
  {
    type: 'suggestion' as const,
    text: 'Try using the STAR method (Situation, Task, Action, Result) for more impact.',
  },
];

/**
 * Constants for performance optimization
 */
const FEEDBACK_STYLES = {
  success: 'border-green-200 text-green-600',
  warning: 'border-yellow-200 text-yellow-600',
  suggestion: 'border-blue-200 text-blue-600'
} as const;


/**
 * InterviewOrchestrator component that handles the interview process
 * including speech recognition, text-to-speech, and feedback
 */
export default function InterviewOrchestrator() {
  // Context hooks
  const { 
    currentPage,
    setCurrentPage, 
    setInterviewStep, 
    setInterviewStarted,
    registerResetToHome
  } = useNavigation();
  
  const { user } = useAuth();

  // State management
  const [isInterviewStarted, setIsInterviewStarted] = useState(false);
  const [showConfiguration, setShowConfiguration] = useState(false);
  const [interviewConfig, setInterviewConfig] = useState<IInterviewConfiguration | null>(null);
  const [isInterviewComplete, setIsInterviewComplete] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [response, setResponse] = useState('');
  const [hasAnswerSubmitted, setHasAnswerSubmitted] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState<VoiceStatus>('idle');
  const [speechServiceInitialized, setSpeechServiceInitialized] = useState(false);
  const [analysis, setAnalysis] = useState<InterviewAnalysis | null>(null);
  const [allFeedback, setAllFeedback] = useState<Array<{ question: string; feedback: string }>>([]);
  const [answeredQuestionIds, setAnsweredQuestionIds] = useState<Set<string>>(new Set());
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  
  // AI Question Generation State
  const [interviewQuestions, setInterviewQuestions] = useState<InterviewQuestion[]>([]);
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  const [questionGenerationError, setQuestionGenerationError] = useState<string | null>(null);
  
  // Session History State
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [sessionSaveStatus, setSessionSaveStatus] = useState<'none' | 'saving' | 'saved' | 'failed'>('none');
  
  // Floating hint system
  const floatingHint = useFloatingHint({
    closeOnEscape: true,
    closeOnClickOutside: true,
    animationDuration: 300,
  });
  
  // Refs for managing speech recognition and audio playback
  const recognitionRef = useRef<SpeechRecognitionInterface | null>(null);
  const speechServiceRef = useRef<IntegratedSpeechService | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ttsRef = useRef<TextToSpeechService | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const feedbackGeneratorRef = useRef<InterviewFeedbackService | null>(null);
  const interviewAnalyzerRef = useRef<InterviewAnalysisService | null>(null);
  const questionGeneratorRef = useRef<QuestionGenerator | null>(null);

  // Initialize speech service with callbacks (without requesting permissions)
  const initializeSpeechService = useCallback(async () => {
    try {
      const callbacks: IntegratedSpeechCallbacks = {
        onTranscriptUpdate: (transcript: string, isFinal: boolean) => {
          if (isFinal) {
            setResponse(prev => (prev ? prev + ' ' : '') + transcript);
          }
        },
        onError: (error: TranscriptionError) => {
          console.error('Speech recognition error:', error);
          setVoiceStatus('error');
        },
        onStatusChange: (status: VoiceStatus) => {
          setVoiceStatus(status);
          setIsListening(status === 'recording');
        },
        onConnectionChange: (connectionStatus) => {
          console.log('AssemblyAI connection status:', connectionStatus);
        }
      };

      speechServiceRef.current = new IntegratedSpeechService(callbacks);
      
      // Don't initialize automatically - wait for user to click record button
      setSpeechServiceInitialized(false);
      
    } catch (error) {
      console.error('Failed to setup speech service:', error);
      setSpeechServiceInitialized(false);
    }
  }, []);

  // Initialize AI services with API key and run Firestore diagnostics
  React.useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      console.error('Gemini API key not found in environment variables');
      return;
    }
    
    try {
      ttsRef.current = new TextToSpeechService(apiKey);
      feedbackGeneratorRef.current = new InterviewFeedbackService(apiKey);
      interviewAnalyzerRef.current = new InterviewAnalysisService(apiKey);
      questionGeneratorRef.current = new QuestionGenerator();
      
      // Initialize speech service with callbacks
      initializeSpeechService();
      
      // Run Firestore diagnostics
      FirestoreConnectionTest.runDiagnostics().catch(console.error);
      
    } catch (error) {
      console.error('Failed to initialize AI services:', error);
    }
  }, [initializeSpeechService]);

  // Cleanup speech service on unmount
  React.useEffect(() => {
    return () => {
      if (speechServiceRef.current) {
        speechServiceRef.current.cleanup().catch(console.error);
      }
    };
  }, []);

  // Get current question from the interview questions array (memoized)
  const currentQuestion = useMemo(() => {
    // Return null if no questions are available
    if (interviewQuestions.length === 0) {
      return null;
    }
    
    // Defensive check to prevent index out of bounds
    if (currentQuestionIndex >= interviewQuestions.length) {
      console.warn(`Question index ${currentQuestionIndex} exceeds available questions (${interviewQuestions.length})`);
      return interviewQuestions[interviewQuestions.length - 1]; // Return last question as fallback
    }
    
    const question = interviewQuestions[currentQuestionIndex];
    
    // Warn if we're about to show a question that was already answered (edge case)
    if (answeredQuestionIds.has(question.id)) {
      console.warn(`Question ${question.id} was already answered. This might indicate a state management issue.`);
    }
    
    return question;
  }, [currentQuestionIndex, answeredQuestionIds, interviewQuestions]);

  // Calculate progress percentage (memoized)
  const progressPercentage = useMemo(() => 
    Math.round(((currentQuestionIndex + 1) / interviewQuestions.length) * 100),
    [currentQuestionIndex, interviewQuestions.length]
  );

  // Memoized feedback item style calculator
  const getFeedbackItemStyle = useCallback((type: FeedbackType) => 
    `flex items-start gap-3 border-l-4 pl-3 ${FEEDBACK_STYLES[type]}`,
    []
  );

  // Auto-resize textarea function - ChatGPT style
  const autoResizeTextarea = useCallback((textarea: HTMLTextAreaElement) => {
    textarea.style.height = 'auto';
    const minHeight = 56; // Small initial height like ChatGPT (about 2 lines)
    const maxHeight = 240; // Maximum height before scrolling
    const newHeight = Math.min(Math.max(textarea.scrollHeight, minHeight), maxHeight);
    textarea.style.height = `${newHeight}px`;
  }, []);

  // Optimized response change handler with auto-resize
  const handleResponseChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setResponse(e.target.value);
    autoResizeTextarea(e.target);
  }, [autoResizeTextarea]);

  // Auto-resize on content change
  React.useEffect(() => {
    if (textareaRef.current) {
      autoResizeTextarea(textareaRef.current);
    }
  }, [response, autoResizeTextarea]);



  /**
   * Converts text to speech and plays it
   * @param text - The text to be spoken
   */
  const speakText = useCallback(async (text: string) => {
    if (!ttsRef.current) {
      console.error('TTS not initialized');
      return;
    }

    try {
      setIsSpeaking(true);
      
      // Track TTS feature usage
      trackFeatureUsed({
        feature_type: 'tts',
        feature_context: 'question_readout'
      });
      
      const audioBuffer = await ttsRef.current.generateSpeech(text);
      const audioBlob = new Blob([audioBuffer], { type: 'audio/wav' });
      const audioUrl = URL.createObjectURL(audioBlob);
      
      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.onended = () => {
          setIsSpeaking(false);
          URL.revokeObjectURL(audioUrl);
        };
        await audioRef.current.play();
      }
    } catch (error) {
      console.error('Error generating speech:', error);
      setIsSpeaking(false);
    }
  }, []);

  // Memoized speak question handler
  const handleSpeakQuestion = useCallback(() => {
    if (currentQuestion) {
      speakText(currentQuestion.question);
    }
  }, [speakText, currentQuestion]);

  /**
   * Generate interview questions using AI based on configuration
   */
  const generateInterviewQuestions = useCallback(async (config: IInterviewConfiguration) => {
    if (!questionGeneratorRef.current) {
      console.error('Question generator not initialized');
      throw new Error('Question generator not initialized');
    }

    setIsGeneratingQuestions(true);
    setQuestionGenerationError(null);

    try {
      const questionCount = process.env.NODE_ENV === 'development' ? QUESTION_COUNT.DEVELOPMENT : QUESTION_COUNT.PRODUCTION;
      console.log(`Environment: ${process.env.NODE_ENV}, generating ${questionCount} questions`);
      
      const generatedQuestions = await questionGeneratorRef.current.generateQuestions(
        config.position,
        config.interviewType,
        questionCount
      );
      
      setInterviewQuestions(generatedQuestions);
      console.log(`Generated ${generatedQuestions.length} questions for ${config.position} (${config.interviewType})`);
      return generatedQuestions;
    } catch (error) {
      console.error('Failed to generate questions:', error);
      setQuestionGenerationError('Failed to generate personalized questions');
      
      // Use fallback questions
      const fallbackQuestions = getFallbackQuestions(config.interviewType);
      setInterviewQuestions(fallbackQuestions);
      console.log(`Using ${fallbackQuestions.length} fallback questions for ${config.interviewType} interview`);
      return fallbackQuestions;
    } finally {
      setIsGeneratingQuestions(false);
    }
  }, []);

  /**
   * Shows the configuration screen
   */
  const handleShowConfiguration = useCallback(() => {
    setShowConfiguration(true);
    setCurrentPage('interview');
    setInterviewStep('configuration');
    setInterviewStarted(true);
  }, [setCurrentPage, setInterviewStep, setInterviewStarted]);

  /**
   * Goes back to landing page from configuration
   */
  const handleBackToLanding = useCallback(() => {
    // Track session abandonment if interview was started
    if (isInterviewStarted && sessionStartTime) {
      const durationSeconds = Math.floor((Date.now() - sessionStartTime) / 1000);
      trackSessionAbandoned({
        questions_completed: allFeedback.length,
        abandonment_point: 'interview',
        duration_seconds: durationSeconds
      });

      // Mark session as abandoned if user is authenticated
      if (user && currentSessionId) {
        try {
          SessionHistoryService.abandonSession(currentSessionId);
        } catch (error) {
          console.error('Failed to mark session as abandoned:', error);
        }
      }
    }
    
    setShowConfiguration(false);
    setCurrentPage('home');
    setInterviewStarted(false);
  }, [setCurrentPage, setInterviewStarted, isInterviewStarted, sessionStartTime, allFeedback.length, user, currentSessionId]);

  /**
   * Starts a new interview session with configuration
   */
  const handleStartInterview = useCallback(async (config: IInterviewConfiguration) => {
    setInterviewConfig(config);
    setShowConfiguration(false);
    setIsInterviewComplete(false);
    setCurrentQuestionIndex(0);
    setResponse('');
    setHasAnswerSubmitted(false);
    setAllFeedback([]);
    setAnsweredQuestionIds(new Set());
    setAnalysis(null);
    floatingHint.actions.reset();
    
    // Update navigation state
    setCurrentPage('interview');
    setInterviewStep('interview');
    setInterviewStarted(true);
    
    // Clear TTS audio cache for new interview session
    if (ttsRef.current) {
      try {
        await ttsRef.current.startNewSession();
      } catch (error) {
        console.warn('Failed to clear TTS cache:', error);
      }
    }
    
    try {
      // Generate questions first
      await generateInterviewQuestions(config);
      // Start interview after questions are generated/loaded
      setIsInterviewStarted(true);
      
      // Track session started
      const startTime = Date.now();
      setSessionStartTime(startTime);
      trackSessionStarted({
        job_position: config.position,
        interview_type: config.interviewType
      });

      // Create session record if user is authenticated
      if (user) {
        console.log('[Session Debug] User authenticated, attempting to create session:', {
          userId: user.uid,
          position: config.position,
          interviewType: config.interviewType,
          NODE_ENV: process.env.NODE_ENV
        });
        
        setSessionSaveStatus('saving');
        
        try {
          const totalQuestions = process.env.NODE_ENV === 'development' 
            ? QUESTION_COUNT.DEVELOPMENT 
            : QUESTION_COUNT.PRODUCTION;
          
          console.log('[Session Debug] Creating session with totalQuestions:', totalQuestions);
          
          const sessionId = await SessionHistoryService.createSession(
            user.uid,
            config.position,
            config.interviewType,
            totalQuestions
          );
          
          console.log('[Session Debug] Session created successfully:', sessionId);
          setCurrentSessionId(sessionId);
          setSessionSaveStatus('saved');
        } catch (error) {
          console.error('[Session Debug] Failed to create session record:', error);
          setSessionSaveStatus('failed');
          // Continue with interview even if session creation fails
        }
      } else {
        console.log('[Session Debug] User not authenticated, skipping session creation');
        setSessionSaveStatus('none');
      }
    } catch (error) {
      console.error('Failed to start interview:', error);
      // Don't start interview if question generation fails completely
      alert('Failed to prepare interview questions. Please try again.');
    }
  }, [generateInterviewQuestions, setCurrentPage, setInterviewStep, setInterviewStarted, user, floatingHint.actions]);

  /**
   * Handles submission of the current answer and shows feedback
   */
  const handleSubmit = useCallback(async () => {
    if (!currentQuestion) {
      alert('No question available.');
      return;
    }
    
    if (response.trim() === '') {
      alert('Please provide an answer before proceeding.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (feedbackGeneratorRef.current) {
        const generatedFeedback = await feedbackGeneratorRef.current.generateFeedback(
          currentQuestion.question,
          response
        );
        setFeedback(generatedFeedback);
        
        // Add feedback to the collection
        setAllFeedback(prev => [
          ...prev,
          {
            question: currentQuestion.question,
            feedback: response
          }
        ]);
        
        // Track answered question to prevent repetition
        setAnsweredQuestionIds(prev => {
          const newSet = new Set(prev);
          newSet.add(currentQuestion.id);
          return newSet;
        });
        
        // Track question answered
        trackQuestionAnswered({
          question_index: currentQuestionIndex,
          question_category: currentQuestion.category,
          response_length: response.trim().length
        });

        // Update session with question and response if user is authenticated
        if (user && currentSessionId) {
          console.log('[Session Debug] Updating session with question:', {
            sessionId: currentSessionId,
            questionIndex: currentQuestionIndex,
            questionText: currentQuestion.question.substring(0, 50) + '...'
          });
          
          try {
            await SessionHistoryService.updateSessionWithQuestion(currentSessionId, {
              question: currentQuestion.question,
              category: currentQuestion.category,
              difficulty: currentQuestion.difficulty || 'Medium',
              userResponse: response.trim(),
              responseTimestamp: Date.now(),
              feedback: generatedFeedback.map(f => ({ type: f.type, text: f.text }))
            });
            
            console.log('[Session Debug] Session updated successfully');
          } catch (error) {
            console.error('[Session Debug] Failed to update session with question:', error);
            // Continue with interview even if session update fails
          }
        } else {
          console.log('[Session Debug] Skipping session update - user:', !!user, 'sessionId:', !!currentSessionId);
        }
      } else {
        console.error('Feedback generator not initialized');
        setFeedback(SAMPLE_FEEDBACK);
      }
      setHasAnswerSubmitted(true);
    } catch (error) {
      console.error('Error generating feedback:', error);
      setFeedback([
        {
          type: 'warning',
          text: 'Unable to generate feedback. Please try again.',
        },
      ]);
    } finally {
      setIsSubmitting(false);
    }
  }, [response, currentQuestion, user, currentSessionId, currentQuestionIndex]);

  const handleFinish = useCallback(async () => {
    if (!interviewAnalyzerRef.current) {
      console.error('Interview analyzer not initialized');
      return;
    }

    setIsAnalyzing(true);
    setIsInterviewComplete(true);
    try {
      const analysis = await interviewAnalyzerRef.current.analyzeInterview(allFeedback);
      setAnalysis(analysis);
      setInterviewStep('summary');
      
      // Track session completed
      if (sessionStartTime) {
        const durationSeconds = Math.floor((Date.now() - sessionStartTime) / 1000);
        const completionRate = (allFeedback.length / interviewQuestions.length) * 100;
        trackSessionCompleted({
          total_questions: interviewQuestions.length,
          duration_seconds: durationSeconds,
          completion_rate: completionRate
        });
      }

      // Complete session record if user is authenticated
      if (user && currentSessionId && analysis) {
        console.log('[Session Debug] Completing session:', {
          sessionId: currentSessionId,
          score: analysis.score,
          verdict: analysis.verdict
        });
        
        try {
          await SessionHistoryService.completeSession(currentSessionId, {
            overallScore: analysis.score,
            strengths: analysis.strengths,
            weaknesses: analysis.weaknesses,
            recommendations: analysis.suggestions,
            hiringVerdict: analysis.verdict,
            detailedFeedback: analysis.summary
          });
          
          console.log('[Session Debug] Session completed successfully');
        } catch (error) {
          console.error('[Session Debug] Failed to complete session record:', error);
          // Continue with interview display even if session completion fails
        }
      } else {
        console.log('[Session Debug] Skipping session completion - user:', !!user, 'sessionId:', !!currentSessionId, 'analysis:', !!analysis);
      }
    } catch (error) {
      console.error('Error generating interview analysis:', error);
      alert('Failed to generate interview analysis. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  }, [allFeedback, setInterviewStep, user, currentSessionId, sessionStartTime, interviewQuestions.length]);

  /**
   * Restart interview from summary screen
   */
  const handleRestartInterview = useCallback(() => {
    setIsInterviewStarted(false);
    setIsInterviewComplete(false);
    setShowConfiguration(false);
    setCurrentQuestionIndex(0);
    setResponse('');
    setHasAnswerSubmitted(false);
    setAllFeedback([]);
    setAnsweredQuestionIds(new Set());
    setAnalysis(null);
    setInterviewQuestions([]);
    setQuestionGenerationError(null);
    setInterviewConfig(null);
    setCurrentSessionId(null);
    setSessionSaveStatus('none');
    floatingHint.actions.reset();
    
    // Reset navigation state
    setCurrentPage('home');
    setInterviewStarted(false);
  }, [setCurrentPage, setInterviewStarted, floatingHint.actions]);

  // Register reset to home function with navigation
  React.useEffect(() => {
    registerResetToHome(handleRestartInterview);
  }, [registerResetToHome, handleRestartInterview]);

  /**
   * Handler for viewing session details
   */
  const handleViewSession = useCallback((sessionId: string) => {
    // This is handled by the SessionHistory component now
    console.log('View session:', sessionId);
  }, []);

  /**
   * Handler for exporting session data
   */
  const handleExportSession = useCallback(async (sessionId: string) => {
    if (!user) return;
    
    try {
      const session = await SessionHistoryService.getSessionById(sessionId, user.uid);
      if (session) {
        // Show options for export format
        const exportFormat = window.confirm('Choose export format:\nOK = Text format\nCancel = JSON format');
        
        if (exportFormat) {
          SessionExportService.exportAsText(session);
        } else {
          SessionExportService.exportAsJSON(session);
        }
      } else {
        alert('Session not found or you do not have permission to export it.');
      }
    } catch (error) {
      console.error('Failed to export session:', error);
      alert('Failed to export session. Please try again.');
    }
  }, [user]);

  /**
   * Moves to the next question or ends the interview
   * Includes validation to prevent question repetition
   */
  const proceedToNextQuestion = useCallback(() => {
    const nextQuestionIndex = currentQuestionIndex + 1;
    
    // Validate we're not exceeding available questions
    if (nextQuestionIndex < interviewQuestions.length) {
      setCurrentQuestionIndex(nextQuestionIndex);
      setResponse('');
      setHasAnswerSubmitted(false);
      floatingHint.actions.close(); // Close hints panel for new question
      
      // Debug log for question progression
      console.log(`Progressed to question ${nextQuestionIndex + 1} of ${interviewQuestions.length}`);
    } else {
      // End interview after last question
      console.log('Interview completed - all questions answered');
      setIsInterviewComplete(true);
      setInterviewStep('summary');
      setHasAnswerSubmitted(false);
    }
  }, [currentQuestionIndex, interviewQuestions.length, setInterviewStep, floatingHint.actions]);





  /**
   * Starts speech recognition to capture user's voice input
   */
  const startListening = useCallback(async () => {
    try {
      // Track speech recognition feature usage
      trackFeatureUsed({
        feature_type: 'speech_recognition',
        feature_context: 'answer_input'
      });
      
      // Initialize speech service if not already done (request permissions here)
      if (!speechServiceInitialized && speechServiceRef.current) {
        setVoiceStatus('processing');
        const initialized = await speechServiceRef.current.initialize();
        setSpeechServiceInitialized(initialized);
        
        if (!initialized) {
          console.warn('Failed to initialize speech service, trying fallback');
          // Don't return here, let it fall through to Web Speech API fallback
        }
      }

      // Use AssemblyAI WebSocket service if available and initialized
      if (speechServiceInitialized && speechServiceRef.current) {
        await speechServiceRef.current.startRecording();
        return;
      }

      // Fallback to Web Speech API for mobile/unsupported browsers
      const SpeechRecognition =
        (window as unknown as Record<string, unknown>).SpeechRecognition || 
        (window as unknown as Record<string, unknown>).webkitSpeechRecognition;
      
      if (!SpeechRecognition) {
        setVoiceStatus('error');
        // More specific error message for different platforms
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const errorMessage = isMobile 
          ? 'Speech recognition is not supported on this mobile browser. Please try Chrome or Safari, or type your response.'
          : 'Speech recognition is not supported in this browser. Please try Chrome, Edge, or Safari, or type your response.';
        alert(errorMessage);
        return;
      }

      // Create recognition instance with mobile-friendly settings
      const recognition = new (SpeechRecognition as new () => SpeechRecognitionInterface)();
      recognition.lang = 'en-US';
      recognition.interimResults = false;
      // Add mobile-friendly settings
      (recognition as unknown as { maxAlternatives: number }).maxAlternatives = 1;
      (recognition as unknown as { continuous: boolean }).continuous = false;
      
      recognition.onresult = (event: SpeechRecognitionEvent) => {
        // Optimized transcript processing
        let transcript = '';
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript + ' ';
        }
        transcript = transcript.trim();
        setResponse(prev => (prev ? prev + ' ' : '') + transcript);
      };
      
      recognition.onend = () => {
        setIsListening(false);
        setVoiceStatus('idle');
      };
      
      recognition.onerror = (event: Event) => {
        const errorEvent = event as any;
        console.error('Speech recognition error:', errorEvent.error);
        setIsListening(false);
        
        // Handle specific errors more gracefully
        if (errorEvent.error === 'not-allowed') {
          setVoiceStatus('error');
          alert('Microphone permission denied. Please allow microphone access and try again.');
        } else if (errorEvent.error === 'no-speech') {
          setVoiceStatus('idle');
          // Don't show error for no-speech, just reset
        } else if (errorEvent.error === 'network') {
          setVoiceStatus('error');
          alert('Network error occurred. Please check your connection and try again.');
        } else {
          setVoiceStatus('error');
        }
      };
      
      recognition.onstart = () => {
        console.log('Speech recognition started');
        setIsListening(true);
        setVoiceStatus('recording');
      };
      
      recognitionRef.current = recognition;
      
      try {
        recognition.start();
      } catch (error) {
        console.error('Failed to start speech recognition:', error);
        setVoiceStatus('error');
        alert('Failed to start speech recognition. Please try again or type your response.');
      }
      
    } catch (error) {
      console.error('Failed to start speech recognition:', error);
      setVoiceStatus('error');
    }
  }, [speechServiceInitialized]);

  /**
   * Stops the active speech recognition session
   */
  const stopListening = useCallback(async () => {
    try {
      // Use AssemblyAI WebSocket service
      if (speechServiceInitialized && speechServiceRef.current) {
        await speechServiceRef.current.stopRecording();
        return;
      }

      // Fallback to Web Speech API
      recognitionRef.current?.stop();
      setIsListening(false);
      setVoiceStatus('idle');
      
    } catch (error) {
      console.error('Failed to stop speech recognition:', error);
      setVoiceStatus('error');
    }
  }, [speechServiceInitialized]);

  /**
   * Toggles speech recognition on/off
   */
  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  /**
   * Handle hint panel toggle with analytics tracking
   */
  const handleHintToggle = useCallback(() => {
    if (!floatingHint.state.isOpen) {
      trackFeatureUsed({
        feature_type: 'hint_panel',
        feature_context: 'question_tips'
      });
    }
    floatingHint.actions.toggle();
  }, [floatingHint.state.isOpen, floatingHint.actions]);

  // History Page View
  if (currentPage === 'history') {
    return (
      <SessionHistory
        onViewSession={handleViewSession}
        onExportSession={handleExportSession}
        onStartNewInterview={handleShowConfiguration}
      />
    );
  }

  // Landing Page View (for home)
  if (currentPage === 'home' && !showConfiguration && !isInterviewStarted) {
    return (
      <LandingPage
        onStartInterview={handleShowConfiguration}
      />
    );
  }

  // Configuration View
  if (showConfiguration) {
    return (
      <InterviewConfiguration
        onStartInterview={handleStartInterview}
        onBack={handleBackToLanding}
      />
    );
  }

  // Question Generation Loading View
  if (isGeneratingQuestions) {
    return (
      <div className="min-h-screen gi-gradient-bg p-4 flex items-center justify-center">
        <div className="gi-card-lg p-8 max-w-md mx-auto text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-teal-600 mx-auto mb-6"></div>
          <h2 className="gi-heading-2 mb-4">Preparing Your Interview</h2>
          <p className="gi-body mb-2">
            Generating personalized questions...
          </p>
          {questionGenerationError && (
            <div className="mt-4 p-3 bg-yellow-100 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-700">
                Using fallback questions - {questionGenerationError}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Hero Page View
  if (!isInterviewStarted) {
    return (
      <div className="min-h-screen gi-gradient-bg">
        <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <div className="text-center">
            <h1 className="gi-heading-1 mb-6">
              <span className="text-5xl sm:text-6xl md:text-7xl">👻</span> Ghost Interviewer
            </h1>
            <p className="gi-body-large max-w-3xl mx-auto mb-16 font-medium">
              Practice interviews. Reflect deeply. Get better.
            </p>
            
            <div className="max-w-3xl mx-auto gi-card-lg p-8 mb-12">
              <h2 className="gi-heading-2 mb-8 text-center">
                Why Ghost Interviewer?
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gray-50 rounded-xl p-6 shadow-sm border border-gray-200">
                  <div className="bg-teal-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-8 h-8 text-teal-600" />
                  </div>
                  <h3 className="gi-heading-3 mb-2">Practice Anywhere</h3>
                  <p className="gi-body">Get interview-ready at your own pace, anytime.</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-6 shadow-sm border border-gray-200">
                  <div className="bg-teal-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <AlertCircle className="w-8 h-8 text-teal-600" />
                  </div>
                  <h3 className="gi-heading-3 mb-2">Instant Feedback</h3>
                  <p className="gi-body">Receive AI-powered feedback on your responses.</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-6 shadow-sm border border-gray-200">
                  <div className="bg-teal-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <HelpCircle className="w-8 h-8 text-teal-600" />
                  </div>
                  <h3 className="gi-heading-3 mb-2">Learn & Improve</h3>
                  <p className="gi-body">Track your progress and enhance your skills.</p>
                </div>
              </div>
            </div>

            <button
              onClick={handleShowConfiguration}
              className="gi-btn-primary inline-flex items-center px-10 py-5 text-xl font-bold hover:shadow-2xl hover:-translate-y-0.5"
            >
              Get Started
              <ArrowRight className="ml-3 w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Interview Complete View
  if (isInterviewComplete) {
    return (
      <div className="space-y-6">
        
        {isAnalyzing ? (
          <div className="min-h-screen gi-gradient-bg p-4 flex items-center justify-center">
            <div className="gi-card-lg p-8 max-w-md mx-auto text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-teal-600 mx-auto mb-6"></div>
              <h2 className="gi-heading-2 mb-4">Analyzing Your Performance</h2>
              <p className="gi-body mb-2">Generating detailed insights and recommendations...</p>
            </div>
          </div>
        ) : analysis ? (
          <InterviewSummary 
            {...analysis} 
            onNewInterview={handleRestartInterview}
            onReviewFeedback={() => {}}
            interviewConfig={interviewConfig || undefined}
          />
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-600">No analysis available.</p>
          </div>
        )}
      </div>
    );
  }

  // Interview View - Ensure questions are available
  if (interviewQuestions.length === 0) {
    return (
      <div className="min-h-screen gi-gradient-bg p-4 flex items-center justify-center">
        <div className="gi-card-lg p-8 max-w-md mx-auto text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="gi-heading-2 mb-4">No Questions Available</h2>
          <p className="gi-body mb-6">
            Failed to load interview questions. Please try starting the interview again.
          </p>
          <button
            onClick={handleRestartInterview}
            className="gi-btn-primary"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  // Interview View
  return (
    <div className="min-h-screen gi-gradient-bg p-4">
      <div className="w-full sm:max-w-2xl mx-auto px-4 space-y-4">
        {/* Progress Indicator */}
        <div className="gi-card p-4">
          <div className="flex justify-between items-center text-sm gi-text-muted mb-2">
            <span>Question {currentQuestionIndex + 1} of {interviewQuestions.length}</span>
            <span>{progressPercentage}% Complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          {questionGenerationError && (
            <div className="mt-2 text-xs text-yellow-600 text-center">
              Using fallback questions for this interview
            </div>
          )}
          
          {/* Session Save Status */}
          {user && (
            <div className="mt-2 text-xs text-center">
              {sessionSaveStatus === 'saving' && (
                <span className="text-blue-600">💾 Saving session...</span>
              )}
              {sessionSaveStatus === 'saved' && (
                <span className="text-green-600">✅ Session saved</span>
              )}
              {sessionSaveStatus === 'failed' && (
                <span className="text-red-600">⚠️ Session save failed (continuing anyway)</span>
              )}
              {sessionSaveStatus === 'none' && (
                <span className="text-gray-500">ℹ️ Session not saved (sign in to save progress)</span>
              )}
            </div>
          )}
        </div>

        <div className="gi-card-lg p-6 space-y-6 transition-opacity duration-300">
          {/* Question Section */}
          <div className="mb-6 space-y-1">
            {/* Category Label */}
            <span className="text-sm font-medium gi-text-muted uppercase tracking-wide">
              {currentQuestion?.category || 'Loading...'}
            </span>

            {/* Question Content */}
            <div className="mt-2 bg-gray-50 rounded-lg p-4 space-y-3">
              <h3 className="gi-heading-3">
                {currentQuestion?.question || 'Loading question...'}
              </h3>
              
              {/* Audio Controls */}
              <div className="flex justify-end">
                {ttsRef.current && (
                  <button
                    type="button"
                    onClick={handleSpeakQuestion}
                    disabled={isSpeaking}
                    className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-500 ${
                      isSpeaking 
                        ? 'border-teal-500 bg-teal-500 hover:bg-teal-600 animate-pulse shadow-lg shadow-teal-500/50 text-white' 
                        : 'border-gray-300 bg-white hover:bg-gray-100 text-gray-600 disabled:opacity-50'
                    }`}
                    aria-label="Play question audio"
                    title="Play question audio"
                  >
                    {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                )}
              </div>
            </div>
          </div>


          {/* Response Section */}
          <div className="mt-6 space-y-4">
            <div className="flex items-start justify-between">
              <label htmlFor="response" className="block text-sm font-medium gi-text-secondary">
                Your Response
              </label>
            </div>


            {/* Response Input */}
            <div className="relative">
              <textarea
                ref={textareaRef}
                id="response"
                value={response}
                onChange={handleResponseChange}
                className="gi-textarea w-full min-h-[56px] pt-4 pl-4 pr-4 pb-12 text-base sm:text-lg resize-none overflow-y-auto"
                placeholder="Type your response here..."
                aria-label="Your interview response"
                rows={1}
                style={{ height: '56px' }}
              />
              
              {/* Microphone Button - Inside textarea */}
              <button
                type="button"
                onClick={toggleListening}
                disabled={voiceStatus === 'processing'}
                className={`absolute bottom-3 right-3 w-8 h-8 rounded-full border-2 transition-all duration-500 focus:outline-none ${
                  voiceStatus === 'recording' 
                    ? 'border-red-500 bg-red-500 hover:bg-red-600 animate-pulse shadow-lg shadow-red-500/50 focus:ring-2 focus:ring-red-400' 
                    : voiceStatus === 'processing'
                    ? 'border-blue-400 bg-blue-50 cursor-not-allowed animate-pulse shadow-lg shadow-blue-400/30'
                    : voiceStatus === 'error'
                    ? 'border-red-300 bg-red-50 hover:bg-red-100 focus:ring-2 focus:ring-red-400'
                    : 'border-gray-300 bg-white hover:bg-gray-50 hover:border-teal-600 focus:ring-2 focus:ring-teal-500'
                } flex items-center justify-center`}
                aria-label={
                  voiceStatus === 'recording' ? 'Stop recording' :
                  voiceStatus === 'processing' ? 'Transcribing your speech...' :
                  voiceStatus === 'error' ? 'Speech recognition failed - click to try again' :
                  'Start voice input'
                }
                aria-pressed={voiceStatus === 'recording'}
                title={
                  voiceStatus === 'recording' ? 'Stop recording' :
                  voiceStatus === 'processing' ? 'Transcribing your speech...' :
                  voiceStatus === 'error' ? 'Speech recognition failed - click to try again' :
                  'Start voice input'
                }
              >
                {voiceStatus === 'recording' ? (
                  <Mic className="w-4 h-4 text-white" />
                ) : voiceStatus === 'processing' ? (
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                ) : voiceStatus === 'error' ? (
                  <Mic className="w-4 h-4 text-red-600" />
                ) : (
                  <Mic className="w-4 h-4 text-gray-600" />
                )}
              </button>
            </div>


            {/* Error Status Message */}
            {voiceStatus === 'error' && (
              <div className="flex items-center gap-2 text-sm text-red-600 mt-2">
                <AlertCircle className="w-4 h-4" />
                <span>Speech recognition failed. Click the microphone to try again.</span>
              </div>
            )}

            {/* Speech Recognition Disclaimer */}
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-gray-500">
                💡 Tip: Speak clearly and pause between sentences for best results
              </p>
            </div>
          </div>

          {/* AI Feedback Section */}
          {hasAnswerSubmitted && (
            <section aria-labelledby="ai-feedback" className="mt-6 bg-gray-50 p-4 rounded-lg border border-gray-200 transition-opacity duration-300">
              <h2 id="ai-feedback" className="text-sm font-semibold text-gray-700 mb-3">
                AI Feedback:
              </h2>
              <ul className="space-y-4">
                {feedback.map((item, index) => (
                  <li 
                    key={index} 
                    className={getFeedbackItemStyle(item.type)}
                  >
                    <span className="flex-shrink-0 mt-0.5">
                      {item.type === 'success' && <CheckCircle className="w-4 h-4" />}
                      {item.type === 'warning' && <AlertCircle className="w-4 h-4" />}
                      {item.type === 'suggestion' && <Lightbulb className="w-4 h-4" />}
                    </span>
                    <p className="text-sm text-gray-800">{item.text}</p>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Action Buttons */}
          <div className="mt-6 flex items-center justify-end gap-4">
            {!hasAnswerSubmitted ? (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || response.trim() === ''}
                className="inline-flex items-center justify-center px-6 py-3 rounded-lg font-semibold text-white bg-teal-600 hover:bg-teal-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Answer'}
              </button>
            ) : (
              <>
                {currentQuestionIndex === interviewQuestions.length - 1 ? (
                  <button
                    onClick={handleFinish}
                    disabled={isAnalyzing}
                    className="inline-flex items-center justify-center px-6 py-3 rounded-lg font-semibold text-white bg-teal-600 hover:bg-teal-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
                  >
                    Finish Interview
                  </button>
                ) : (
                  <button
                    onClick={proceedToNextQuestion}
                    className="inline-flex items-center justify-center px-6 py-3 rounded-lg font-semibold text-white bg-teal-600 hover:bg-teal-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
                  >
                    Next Question
                  </button>
                )}
              </>
            )}
          </div>

          {/* Hidden audio element */}
          <audio ref={audioRef} className="hidden" />
        </div>

        {/* Floating Hint System */}
        {currentQuestion?.tips && currentQuestion.tips.length > 0 && (
          <>
            <HintButton
              onClick={handleHintToggle}
              isOpen={floatingHint.state.isOpen}
              buttonRef={floatingHint.buttonRef}
            />
            <FloatingHintPanel
              isOpen={floatingHint.state.isOpen}
              isVisible={floatingHint.state.isVisible}
              isAnimating={floatingHint.state.isAnimating}
              deviceType={floatingHint.deviceType}
              tips={currentQuestion.tips}
              onClose={floatingHint.actions.close}
              panelRef={floatingHint.panelRef}
            />
          </>
        )}
      </div>
    </div>
  );
} 
