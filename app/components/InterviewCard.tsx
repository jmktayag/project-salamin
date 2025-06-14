'use client';

import React, { useRef, useState, useMemo, useCallback } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Square,
  CheckCircle,
  Lightbulb,
} from 'lucide-react';
import { interviewQuestions } from '../data/interviewQuestions';
import { TextToSpeech } from '../utils/TextToSpeech';
import { FeedbackGenerator } from '../utils/FeedbackGenerator';
import { InterviewSummary } from './InterviewSummary';
import { InterviewAnalyzer } from '../utils/InterviewAnalyzer';

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
 * Web Speech API type definitions for TypeScript
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

interface SpeechRecognition extends EventTarget {
  lang: string;
  interimResults: boolean;
  onresult: (event: SpeechRecognitionEvent) => void;
  onend: () => void;
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

const FEEDBACK_ICONS = {
  success: 'w-5 h-5 text-green-500',
  warning: 'w-5 h-5 text-yellow-500',
  suggestion: 'w-5 h-5 text-blue-500'
} as const;

/**
 * InterviewCard component that handles the interview process
 * including speech recognition, text-to-speech, and feedback
 */
export default function InterviewCard() {
  // State management
  const [isInterviewStarted, setIsInterviewStarted] = useState(false);
  const [isInterviewComplete, setIsInterviewComplete] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [response, setResponse] = useState('');
  const [hasAnswerSubmitted, setHasAnswerSubmitted] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [allFeedback, setAllFeedback] = useState<Array<{ question: string; feedback: string }>>([]);
  const [answeredQuestionIds, setAnsweredQuestionIds] = useState<Set<string>>(new Set());
  
  // Refs for managing speech recognition and audio playback
  const recognitionRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ttsRef = useRef<TextToSpeech | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const feedbackGeneratorRef = useRef<FeedbackGenerator | null>(null);
  const interviewAnalyzerRef = useRef<InterviewAnalyzer | null>(null);

  // Initialize Text-to-Speech, Feedback Generator, and Interview Analyzer with API key
  React.useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      console.error('Gemini API key not found in environment variables');
      return;
    }
    
    try {
      ttsRef.current = new TextToSpeech(apiKey);
      feedbackGeneratorRef.current = new FeedbackGenerator(apiKey);
      interviewAnalyzerRef.current = new InterviewAnalyzer(apiKey);
    } catch (error) {
      console.error('Failed to initialize AI services:', error);
    }
  }, []);

  // Get current question from the interview questions array (memoized)
  const currentQuestion = useMemo(() => {
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
  }, [currentQuestionIndex, answeredQuestionIds]);

  // Calculate progress percentage (memoized)
  const progressPercentage = useMemo(() => 
    Math.round(((currentQuestionIndex + 1) / interviewQuestions.length) * 100),
    [currentQuestionIndex]
  );

  // Memoized feedback item style calculator
  const getFeedbackItemStyle = useCallback((type: FeedbackType) => 
    `flex items-start gap-3 border-l-4 pl-3 ${FEEDBACK_STYLES[type]}`,
    []
  );

  // Optimized response change handler
  const handleResponseChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setResponse(e.target.value);
  }, []);

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
    speakText(currentQuestion.question);
  }, [speakText, currentQuestion.question]);

  /**
   * Starts a new interview session
   */
  const handleStartInterview = useCallback(() => {
    setIsInterviewStarted(true);
    setIsInterviewComplete(false);
    setCurrentQuestionIndex(0);
    setResponse('');
    setHasAnswerSubmitted(false);
  }, []);

  /**
   * Handles submission of the current answer and shows feedback
   */
  const handleSubmit = useCallback(async () => {
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
  }, [response, currentQuestion.question]);

  const handleFinish = useCallback(async () => {
    if (!interviewAnalyzerRef.current) {
      console.error('Interview analyzer not initialized');
      return;
    }

    setIsAnalyzing(true);
    try {
      const analysis = await interviewAnalyzerRef.current.analyzeInterview(allFeedback);
      setAnalysis(analysis);
      setIsInterviewComplete(true);
    } catch (error) {
      console.error('Error generating interview analysis:', error);
      alert('Failed to generate interview analysis. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  }, [allFeedback]);

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
      
      // Debug log for question progression
      console.log(`Progressed to question ${nextQuestionIndex + 1} of ${interviewQuestions.length}`);
    } else {
      // End interview after last question
      console.log('Interview completed - all questions answered');
      setIsInterviewComplete(true);
      setHasAnswerSubmitted(false);
    }
  }, [currentQuestionIndex]);

  /**
   * Saves feedback for the current question
   */
  const handleSaveFeedback = useCallback(() => {
    console.log('Saving feedback for question:', currentQuestion.id);
  }, [currentQuestion.id]);

  /**
   * Resets the interview state to start over
   * Ensures clean state to prevent question repetition
   */
  const handleRestartInterview = useCallback(() => {
    console.log('Restarting interview - resetting all state');
    setIsInterviewStarted(false);
    setIsInterviewComplete(false);
    setCurrentQuestionIndex(0);
    setResponse('');
    setAllFeedback([]);
    setFeedback([]);
    setAnalysis(null);
    setHasAnswerSubmitted(false);
    setIsAnalyzing(false);
    setAnsweredQuestionIds(new Set());
    
    // Verify state reset
    console.log(`Interview reset - starting with ${interviewQuestions.length} questions available`);
  }, []);


  /**
   * Returns the appropriate icon for each feedback type (memoized)
   * @param type - The type of feedback (success, warning, or info)
   * @returns React component with the appropriate icon
   */
  const getFeedbackIcon = useCallback((type: FeedbackType) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className={FEEDBACK_ICONS.success} />;
      case 'warning':
        return <AlertCircle className={FEEDBACK_ICONS.warning} />;
      case 'suggestion':
        return <HelpCircle className={FEEDBACK_ICONS.suggestion} />;
    }
  }, []);

  /**
   * Starts speech recognition to capture user's voice input
   */
  const startListening = useCallback(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition not supported in this browser.');
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
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
      setIsRecording(false);
    };
    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
    setIsRecording(true);
  }, []);

  /**
   * Stops the active speech recognition session
   */
  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
    setIsRecording(false);
  }, []);

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

  // Hero Page View
  if (!isInterviewStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary/20 to-secondary/20">
        <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Ghost Interviewer
              <span className="text-primary"> 👻</span>
            </h1>
            <p className="text-xl sm:text-2xl text-gray-600 max-w-3xl mx-auto mb-12">
              Practice interviews. Reflect deeply. Get better.
            </p>
            
            <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl p-8 mb-12">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                Why Ghost Interviewer?
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Practice Anywhere</h3>
                  <p className="text-gray-600">Get interview-ready at your own pace, anytime.</p>
                </div>
                <div className="text-center">
                  <div className="bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <AlertCircle className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Instant Feedback</h3>
                  <p className="text-gray-600">Receive AI-powered feedback on your responses.</p>
                </div>
                <div className="text-center">
                  <div className="bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <HelpCircle className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Learn & Improve</h3>
                  <p className="text-gray-600">Track your progress and enhance your skills.</p>
                </div>
              </div>
            </div>

            <button
              onClick={handleStartInterview}
              className="inline-flex items-center px-8 py-4 text-lg font-semibold text-white bg-primary rounded-xl hover:bg-primary-dark transition-colors shadow-lg hover:shadow-xl"
            >
              Start Your Interview
              <ArrowRight className="ml-2 w-5 h-5" />
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
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Generating your interview analysis...</p>
          </div>
        ) : analysis ? (
          <InterviewSummary 
            {...analysis} 
            onNewInterview={handleRestartInterview}
            onReviewFeedback={() => setShowFeedback(true)}
          />
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-600">No analysis available.</p>
          </div>
        )}
      </div>
    );
  }

  // Interview View
  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="w-full sm:max-w-2xl mx-auto px-4 space-y-4">
        {/* Progress Indicator */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex justify-between items-center text-sm text-gray-600 mb-2">
            <span>Question {currentQuestionIndex + 1} of {interviewQuestions.length}</span>
            <span>{progressPercentage}% Complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 space-y-6 transition-opacity duration-300">
          {/* Question Section */}
          <div className="mb-6 space-y-1">
            {/* Category Label */}
            <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">
              {currentQuestion.category}
            </span>

            {/* Question Content */}
            <div className="mt-2 bg-gray-50 rounded-lg p-4 space-y-3">
              <h3 className="text-lg font-semibold text-gray-900">
                {currentQuestion.question}
              </h3>
              <p className="text-sm text-gray-600">
                Example: &quot;I&apos;m a senior iOS developer with 8+ years of experience building scalable apps.&quot;
              </p>
              
              {/* Audio Controls */}
              <div className="flex justify-end">
                {ttsRef.current && (
                  <button
                    type="button"
                    onClick={handleSpeakQuestion}
                    disabled={isSpeaking}
                    className="w-8 h-8 rounded-full bg-white border border-gray-300 shadow-sm flex items-center justify-center text-gray-600 hover:bg-gray-100 transition disabled:opacity-50"
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
              <label htmlFor="response" className="block text-sm font-medium text-gray-700">
                Your Response
              </label>
            </div>

            {/* Response Input */}
            <div className="relative">
              <textarea
                id="response"
                value={response}
                onChange={handleResponseChange}
                className="w-full min-h-[120px] p-4 pr-12 rounded-lg border border-gray-300 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-base sm:text-lg transition"
                placeholder="Type your response here..."
                aria-label="Your interview response"
              />
              <button
                type="button"
                onClick={toggleListening}
                className={`absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white border border-gray-300 shadow-sm flex items-center justify-center transition ${
                  isRecording ? 'text-red-600 border-red-600' : 'text-gray-600 hover:bg-gray-100'
                }`}
                aria-label={isRecording ? 'Stop recording' : 'Start recording'}
                title={isRecording ? 'Stop recording' : 'Start recording'}
              >
                {isRecording ? <Square className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
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
                disabled={isSubmitting}
                className="inline-flex items-center justify-center px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 focus:ring-2 focus:ring-teal-500 focus:outline-none transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Answer'}
              </button>
            ) : (
              <>
                {currentQuestionIndex === interviewQuestions.length - 1 ? (
                  <button
                    onClick={handleFinish}
                    disabled={isAnalyzing}
                    className="inline-flex items-center justify-center px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 focus:ring-2 focus:ring-teal-500 focus:outline-none transition-colors disabled:opacity-50"
                  >
                    {isAnalyzing ? 'Analyzing...' : 'Finish Interview'}
                  </button>
                ) : (
                  <button
                    onClick={proceedToNextQuestion}
                    className="inline-flex items-center justify-center px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 focus:ring-2 focus:ring-teal-500 focus:outline-none transition-colors"
                  >
                    Next Question
                  </button>
                )}
                <button
                  onClick={handleSaveFeedback}
                  className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-gray-800 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-gray-400 focus:outline-none transition-colors"
                >
                  Save Feedback
                </button>
              </>
            )}
          </div>

          {/* Hidden audio element */}
          <audio ref={audioRef} className="hidden" />
        </div>
      </div>
    </div>
  );
} 
