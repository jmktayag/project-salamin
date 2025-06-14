'use client';

import React, { useRef, useState } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  Mic,
  MicOff,
} from 'lucide-react';
import { interviewQuestions } from '../data/interviewQuestions';

// Types
type FeedbackType = 'success' | 'warning' | 'info';

interface FeedbackItem {
  type: FeedbackType;
  text: string;
}

// Constants
const SAMPLE_FEEDBACK: FeedbackItem[] = [
  {
    type: 'success',
    text: 'Good structure in your response with a clear problem statement.',
  },
  {
    type: 'warning',
    text: 'Consider adding more specific details about the outcomes achieved.',
  },
  {
    type: 'info',
    text: 'Try using the STAR method (Situation, Task, Action, Result) for more impact.',
  },
];

// Component
export default function InterviewCard() {
  // State
  const [isInterviewStarted, setIsInterviewStarted] = useState(false);
  const [isInterviewComplete, setIsInterviewComplete] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [response, setResponse] = useState('');
  const [hasAnswerSubmitted, setHasAnswerSubmitted] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Current question
  const currentQuestion = interviewQuestions[currentQuestionIndex];

  // Handlers
  const handleStartInterview = () => {
    console.log('Starting interview');
    setIsInterviewStarted(true);
    setIsInterviewComplete(false);
    setCurrentQuestionIndex(0);
    setResponse('');
    setHasAnswerSubmitted(false); // Reset on new interview
  };

  const handleResponseChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setResponse(e.target.value);
  };

  const startListening = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition not supported in this browser.');
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.onresult = event => {
      const transcript = Array.from(event.results)
        .map(result => result[0])
        .map(result => result.transcript)
        .join(' ');
      setResponse(prev => (prev ? prev + ' ' : '') + transcript);
    };
    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleNextQuestion = () => {
    if (response.trim() === '') {
      alert('Please provide an answer before proceeding.');
      return;
    }
    setHasAnswerSubmitted(true);
    // The AI feedback will now show. User can review before moving to next question.
    // To move to the next question immediately after submitting, move the following block
    // outside of this conditional rendering logic.
    // For now, let's keep it this way to ensure feedback is shown.

    // If you want to automatically go to the next question/complete interview
    // after feedback is shown, you'd need another button or a timeout.
    // For this task, we will simply show the feedback after submission.
  };

  const proceedToNextQuestion = () => {
    if (currentQuestionIndex < interviewQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setResponse('');
      setHasAnswerSubmitted(false); // Reset for next question
    } else {
      setIsInterviewComplete(true);
      setHasAnswerSubmitted(false); // Reset on interview complete
    }
  };

  const handleSaveFeedback = () => {
    console.log('Saving feedback for question:', currentQuestion.id);
  };

  const handleRestartInterview = () => {
    setIsInterviewStarted(false);
    setIsInterviewComplete(false);
    setCurrentQuestionIndex(0);
    setResponse('');
    setHasAnswerSubmitted(false);
  };

  // Helper functions
  const getFeedbackIcon = (type: FeedbackType) => {
    const iconProps = { className: 'w-5 h-5' };
    
    switch (type) {
      case 'success':
        return <CheckCircle2 {...iconProps} className={`${iconProps.className} text-green-500`} />;
      case 'warning':
        return <AlertCircle {...iconProps} className={`${iconProps.className} text-yellow-500`} />;
      case 'info':
        return <HelpCircle {...iconProps} className={`${iconProps.className} text-blue-500`} />;
    }
  };

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
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="max-w-xl w-full bg-white rounded-xl shadow-md p-8 text-center space-y-6">
          <h2 className="text-3xl font-bold text-gray-900">
            Interview Complete! 🎉
          </h2>
          <p className="text-lg text-gray-600">
            You&apos;ve completed all the interview questions. Great job!
          </p>
          <div className="space-y-4">
            <button
              type="button"
              onClick={handleRestartInterview}
              className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-3 px-8 rounded-xl shadow-md transition-colors"
            >
              Start New Interview
            </button>
            <button
              type="button"
              onClick={handleSaveFeedback}
              className="w-full border border-gray-300 bg-white text-gray-700 font-semibold py-3 px-8 rounded-xl hover:bg-gray-50 transition-colors"
            >
              Review Feedback
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Interview View
  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-2xl mx-auto space-y-4">
        {/* Progress Indicator */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex justify-between items-center text-sm text-gray-600 mb-2">
            <span>Question {currentQuestionIndex + 1} of {interviewQuestions.length}</span>
            <span>{Math.round(((currentQuestionIndex + 1) / interviewQuestions.length) * 100)}% Complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentQuestionIndex + 1) / interviewQuestions.length) * 100}%` }}
            />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 space-y-6">
          {/* Question Section */}
          <div className="space-y-2 bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-500">{currentQuestion.category}</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              {currentQuestion.question}
            </h3>
          </div>

          {/* Response Section */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <label className="block text-sm font-medium text-gray-700">
                Your Response:
              </label>
              <button
                type="button"
                onClick={toggleListening}
                aria-label={isListening ? 'Stop recording' : 'Start recording'}
                className="p-2 border rounded-full text-gray-600 hover:bg-gray-100"
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
            </div>
            <textarea
              value={response}
              onChange={handleResponseChange}
              className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
              placeholder="Type your response here..."
            />
          </div>

          {/* 
          // Tips Section
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-700">
              Tips:
            </h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
              {currentQuestion.tips.map((tip, index) => (
                <li key={index}>{tip}</li>
              ))}
            </ul>
          </div>
          */}

          {/* Feedback Section - Conditionally rendered */}
          {hasAnswerSubmitted && (
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-700">
                AI Feedback:
              </h3>
              <div className="space-y-3">
                {SAMPLE_FEEDBACK.map((feedback, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                  >
                    {getFeedbackIcon(feedback.type)}
                    <p className="text-sm text-gray-600">{feedback.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="max-w-xl mx-auto flex gap-4 mt-6">
            {!hasAnswerSubmitted && (
              <button
                type="button"
                onClick={handleNextQuestion}
                className="flex-1 bg-primary text-white px-6 py-2 rounded-xl font-medium hover:bg-primary-dark transition-colors"
              >
                Submit Answer
              </button>
            )}

            {hasAnswerSubmitted && (
              <button
                type="button"
                onClick={proceedToNextQuestion}
                className="flex-1 bg-primary text-white px-6 py-2 rounded-xl font-medium hover:bg-primary-dark transition-colors"
              >
                {currentQuestionIndex === interviewQuestions.length - 1 ? 'Finish Interview' : 'Next Question'}
              </button>
            )}

            {hasAnswerSubmitted && (
              <button
                type="button"
                onClick={handleSaveFeedback}
                className="flex-1 border border-gray-300 bg-white text-gray-700 px-6 py-2 rounded-xl font-medium hover:bg-gray-50 transition-colors"
              >
                Save Feedback
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 
