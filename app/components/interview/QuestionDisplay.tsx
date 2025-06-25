'use client';

import React from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { InterviewQuestion } from '../../data/interviewQuestions';

interface QuestionDisplayProps {
  question: InterviewQuestion | null;
  isSpeaking: boolean;
  onSpeakQuestion: () => void;
  hasTTS: boolean;
}

export function QuestionDisplay({ 
  question, 
  isSpeaking, 
  onSpeakQuestion, 
  hasTTS 
}: QuestionDisplayProps) {
  return (
    <div className="mb-6 space-y-1">
      {/* Category Label */}
      <span className="text-sm font-medium gi-text-muted uppercase tracking-wide">
        {question?.category || 'Loading...'}
      </span>

      {/* Question Content */}
      <div className="mt-2 bg-gray-50 rounded-lg p-4 space-y-3">
        <h3 className="gi-heading-3">
          {question?.question || 'Loading question...'}
        </h3>
        
        {/* Audio Controls */}
        <div className="flex justify-end">
          {hasTTS && (
            <button
              type="button"
              onClick={onSpeakQuestion}
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
  );
}