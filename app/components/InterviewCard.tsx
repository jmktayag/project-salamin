'use client';

import React, { useState, useEffect, useRef } from 'react';
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

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition =
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).SpeechRecognition ||
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const transcript = Array.from(event.results as any)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((result: any) => result[0].transcript)
        .join('');
      setResponse((prev) => (prev ? `${prev} ${transcript}` : transcript));
    };
    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;
  }, []);

  const handleToggleListening = () => {
    const recognition = recognitionRef.current;
    if (!recognition) return;
    if (isListening) {
      recognition.stop();
    } else {
      setIsListening(true);
      recognition.start();
    }
  };

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
      setCurrentQuestionIndex((prev) => prev + 1);
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
        return (
          <CheckCircle2
            {...iconProps}
            className={`${iconProps.className} text-green-500`}
          />
        );
      case 'warning':
        return (
          <AlertCircle
            {...iconProps}
            className={`${iconProps.className} text-yellow-500`}
          />
        );
      case 'info':
        return (
          <HelpCircle
            {...iconProps}
            className={`${iconProps.className} text-blue-500`}
          />
        );
    }
  };

  // Hero Page View
  if (!isInterviewStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <div className="text-center">
            <h1 className="mb-6 text-4xl font-bold text-gray-900 sm:text-5xl md:text-6xl">
              Ghost Interviewer
              <span className="text-teal-600"> 👻</span>
            </h1>
            <p className="mx-auto mb-12 max-w-3xl text-xl text-gray-600 sm:text-2xl">
              Practice interviews. Reflect deeply. Get better.
            </p>

            <div className="mx-auto mb-12 max-w-3xl rounded-2xl bg-white p-8 shadow-xl">
              <h2 className="mb-6 text-2xl font-semibold text-gray-900">
                Why Ghost Interviewer?
              </h2>
              <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
                <div className="text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-teal-50">
                    <CheckCircle2 className="h-8 w-8 text-teal-600" />
                  </div>
                  <h3 className="mb-2 text-lg font-medium text-gray-900">
                    Practice Anywhere
                  </h3>
                  <p className="text-gray-600">
                    Get interview-ready at your own pace, anytime.
                  </p>
                </div>
                <div className="text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-teal-50">
                    <AlertCircle className="h-8 w-8 text-teal-600" />
                  </div>
                  <h3 className="mb-2 text-lg font-medium text-gray-900">
                    Instant Feedback
                  </h3>
                  <p className="text-gray-600">
                    Receive AI-powered feedback on your responses.
                  </p>
                </div>
                <div className="text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-teal-50">
                    <HelpCircle className="h-8 w-8 text-teal-600" />
                  </div>
                  <h3 className="mb-2 text-lg font-medium text-gray-900">
                    Learn & Improve
                  </h3>
                  <p className="text-gray-600">
                    Track your progress and enhance your skills.
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={handleStartInterview}
              className="inline-flex items-center rounded-xl bg-teal-600 px-8 py-4 text-lg font-semibold text-white shadow-lg transition-colors hover:bg-teal-700 hover:shadow-xl"
            >
              Start Your Interview
              <ArrowRight className="ml-2 h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Interview Complete View
  if (isInterviewComplete) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
        <div className="w-full max-w-xl space-y-6 rounded-xl bg-white p-8 text-center shadow-md">
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
              className="w-full rounded-xl bg-teal-600 px-8 py-3 font-semibold text-white shadow-md transition-colors hover:bg-teal-700"
            >
              Start New Interview
            </button>
            <button
              type="button"
              onClick={handleSaveFeedback}
              className="w-full rounded-xl border border-gray-300 bg-white px-8 py-3 font-semibold text-gray-700 transition-colors hover:bg-gray-50"
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
      <div className="mx-auto max-w-2xl space-y-6 rounded-xl bg-white p-6 shadow-md">
        {/* Question Section */}
        <div className="space-y-2 rounded-lg bg-gray-50 p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500">
              {currentQuestion.category}
            </span>
            <span className="text-sm font-medium text-gray-500">
              Question {currentQuestionIndex + 1} of {interviewQuestions.length}
            </span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900">
            {currentQuestion.question}
          </h3>
        </div>

        {/* Response Section */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Your Response:
          </label>
          <div className="relative">
            <textarea
              value={response}
              onChange={handleResponseChange}
              className="h-32 w-full resize-none rounded-lg border border-gray-300 p-3 pr-10 focus:border-transparent focus:ring-2 focus:ring-teal-500"
              placeholder="Type your response here..."
            />
            <button
              type="button"
              onClick={handleToggleListening}
              className="absolute bottom-2 right-2 text-gray-500 hover:text-gray-700"
            >
              {isListening ? (
                <MicOff className="h-5 w-5" />
              ) : (
                <Mic className="h-5 w-5" />
              )}
            </button>
          </div>
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
            <h3 className="text-sm font-medium text-gray-700">AI Feedback:</h3>
            <div className="space-y-3">
              {SAMPLE_FEEDBACK.map((feedback, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 rounded-lg bg-gray-50 p-3"
                >
                  {getFeedbackIcon(feedback.type)}
                  <p className="text-sm text-gray-600">{feedback.text}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mx-auto mt-6 flex max-w-xl gap-4">
          {!hasAnswerSubmitted && (
            <button
              type="button"
              onClick={handleNextQuestion}
              className="flex-1 rounded-xl bg-teal-600 px-6 py-2 font-medium text-white transition-colors hover:bg-teal-700"
            >
              Submit Answer
            </button>
          )}

          {hasAnswerSubmitted && (
            <button
              type="button"
              onClick={proceedToNextQuestion}
              className="flex-1 rounded-xl bg-teal-600 px-6 py-2 font-medium text-white transition-colors hover:bg-teal-700"
            >
              {currentQuestionIndex === interviewQuestions.length - 1
                ? 'Finish Interview'
                : 'Next Question'}
            </button>
          )}

          {hasAnswerSubmitted && (
            <button
              type="button"
              onClick={handleSaveFeedback}
              className="flex-1 rounded-xl border border-gray-300 bg-white px-6 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              Save Feedback
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
