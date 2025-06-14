'use client';

import React, { useState } from 'react';
import { CheckCircle2, AlertCircle, HelpCircle } from 'lucide-react';

// Feedback item type definition
type FeedbackItem = {
  type: 'success' | 'warning' | 'info';
  text: string;
};

// Sample feedback items
const sampleFeedback: FeedbackItem[] = [
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

export default function InterviewCard() {
  const [isInterviewStarted, setIsInterviewStarted] = useState(false);
  const [response, setResponse] = useState('');

  // Function to get the appropriate icon for feedback type
  const getFeedbackIcon = (type: FeedbackItem['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'info':
        return <HelpCircle className="w-5 h-5 text-blue-500" />;
    }
  };

  // Hero Page View
  if (!isInterviewStarted) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="max-w-xl w-full bg-white rounded-xl shadow-md p-8 text-center space-y-6">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
            Ghost Interviewer 👻
          </h1>
          <p className="text-xl text-gray-600">
            Practice interviews. Reflect deeply. Get better.
          </p>
          <button
            onClick={() => setIsInterviewStarted(true)}
            className="bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 px-8 rounded-xl shadow-md transition-colors"
          >
            Start Interview
          </button>
        </div>
      </div>
    );
  }

  // Interview View
  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      {/* Main Interview Card */}
      <div className="max-w-xl mx-auto bg-white rounded-xl shadow-md p-6 space-y-6">
        {/* Question Section */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            AI Interviewer:
          </label>
          <p className="text-lg font-semibold text-gray-900">
            What are your greatest strengths and how do they align with this position?
          </p>
        </div>

        {/* Response Section */}
        <div className="space-y-2">
          <label 
            htmlFor="response" 
            className="block text-sm font-medium text-gray-700"
          >
            Your Response:
          </label>
          <textarea
            id="response"
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            placeholder="Type your response here..."
            className="w-full h-32 px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 resize-none"
          />
        </div>

        {/* Feedback Section */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700">
            AI Feedback:
          </h3>
          <div className="bg-blue-50 p-4 rounded-lg space-y-3">
            {sampleFeedback.map((item, index) => (
              <div key={index} className="flex items-start space-x-3">
                {getFeedbackIcon(item.type)}
                <p className="text-sm text-gray-700">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="max-w-xl mx-auto flex gap-4 mt-6">
        <button
          className="flex-1 bg-teal-600 text-white px-6 py-2 rounded-xl font-medium hover:bg-teal-700 transition-colors"
        >
          Next Question
        </button>
        <button
          className="flex-1 border border-gray-300 bg-white text-gray-700 px-6 py-2 rounded-xl font-medium hover:bg-gray-50 transition-colors"
        >
          Save Feedback
        </button>
      </div>
    </div>
  );
} 