'use client';

import React from 'react';
import { ActionButton } from '../ui';

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
        <ActionButton
          action="submit"
          onClick={onSubmit}
          isLoading={isSubmitting}
          size="lg"
        />
      ) : (
        <>
          {isLastQuestion ? (
            <ActionButton
              action="finish"
              onClick={onFinish}
              isLoading={isAnalyzing}
              size="lg"
            />
          ) : (
            <ActionButton
              action="next"
              onClick={onNext}
              size="lg"
            />
          )}
        </>
      )}
    </div>
  );
}