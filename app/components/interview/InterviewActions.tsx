'use client';

import React from 'react';
import { InterviewActionButton } from '../ui';

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
        <InterviewActionButton
          action="submit"
          onClick={onSubmit}
          isLoading={isSubmitting}
        />
      ) : (
        <>
          {isLastQuestion ? (
            <InterviewActionButton
              action="finish"
              onClick={onFinish}
              isLoading={isAnalyzing}
            />
          ) : (
            <InterviewActionButton
              action="next"
              onClick={onNext}
            />
          )}
        </>
      )}
    </div>
  );
}