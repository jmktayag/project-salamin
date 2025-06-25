'use client';

import React from 'react';

interface InterviewActionsProps {
  hasAnswerSubmitted: boolean;
  isSubmitting: boolean;
  isAnalyzing: boolean;
  isLastQuestion: boolean;
  onSubmit: () => void;
  onNext: () => void;
  onFinish: () => void;
}

export function InterviewActions({ 
  hasAnswerSubmitted, 
  isSubmitting, 
  isAnalyzing, 
  isLastQuestion, 
  onSubmit, 
  onNext, 
  onFinish 
}: InterviewActionsProps) {
  return (
    <div className="mt-6 flex items-center justify-end gap-4">
      {!hasAnswerSubmitted ? (
        <button
          onClick={onSubmit}
          disabled={isSubmitting}
          className="gi-btn-primary inline-flex items-center justify-center px-6 py-3 focus:ring-2 focus:ring-teal-500 focus:outline-none disabled:opacity-50"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Answer'}
        </button>
      ) : (
        <>
          {isLastQuestion ? (
            <button
              onClick={onFinish}
              disabled={isAnalyzing}
              className="gi-btn-primary inline-flex items-center justify-center px-6 py-3 focus:ring-2 focus:ring-teal-500 focus:outline-none disabled:opacity-50"
            >
              {isAnalyzing ? 'Analyzing...' : 'Finish Interview'}
            </button>
          ) : (
            <button
              onClick={onNext}
              className="gi-btn-primary inline-flex items-center justify-center px-6 py-3 focus:ring-2 focus:ring-teal-500 focus:outline-none"
            >
              Next Question
            </button>
          )}
        </>
      )}
    </div>
  );
}