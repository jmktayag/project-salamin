'use client';

import React from 'react';
import { CheckCircle, AlertCircle, Lightbulb } from 'lucide-react';

type FeedbackType = 'success' | 'warning' | 'suggestion';

interface FeedbackItem {
  type: FeedbackType;
  text: string;
}

interface FeedbackDisplayProps {
  feedback: FeedbackItem[];
  isVisible: boolean;
}

const FEEDBACK_STYLES = {
  success: 'border-green-200 text-green-600',
  warning: 'border-yellow-200 text-yellow-600',
  suggestion: 'border-blue-200 text-blue-600'
} as const;

export function FeedbackDisplay({ feedback, isVisible }: FeedbackDisplayProps) {
  const getFeedbackItemStyle = (type: FeedbackType) => 
    `flex items-start gap-3 border-l-4 pl-3 ${FEEDBACK_STYLES[type]}`;

  if (!isVisible) {
    return null;
  }

  return (
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
  );
}

export type { FeedbackItem, FeedbackType };