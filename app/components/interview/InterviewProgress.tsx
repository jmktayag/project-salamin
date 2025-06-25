'use client';

import React from 'react';

interface InterviewProgressProps {
  currentQuestionIndex: number;
  totalQuestions: number;
  questionGenerationError?: string | null;
}

export function InterviewProgress({ 
  currentQuestionIndex, 
  totalQuestions, 
  questionGenerationError 
}: InterviewProgressProps) {
  const progressPercentage = Math.round(((currentQuestionIndex + 1) / totalQuestions) * 100);

  return (
    <div className="gi-card p-4">
      <div className="flex justify-between items-center text-sm gi-text-muted mb-2">
        <span>Question {currentQuestionIndex + 1} of {totalQuestions}</span>
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
    </div>
  );
}