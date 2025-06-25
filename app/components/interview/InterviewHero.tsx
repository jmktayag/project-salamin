'use client';

import React from 'react';
import { CheckCircle2, AlertCircle, HelpCircle, ArrowRight } from 'lucide-react';

interface InterviewHeroProps {
  onShowConfiguration: () => void;
}

export function InterviewHero({ onShowConfiguration }: InterviewHeroProps) {
  return (
    <div className="min-h-screen gi-gradient-bg">
      <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="text-center">
          <h1 className="gi-heading-1 mb-6">
            <span className="text-5xl sm:text-6xl md:text-7xl">👻</span> Ghost Interviewer
          </h1>
          <p className="gi-body-large max-w-3xl mx-auto mb-16 font-medium">
            Practice interviews. Reflect deeply. Get better.
          </p>
          
          <div className="max-w-3xl mx-auto gi-card-lg p-8 mb-12">
            <h2 className="gi-heading-2 mb-8 text-center">
              Why Ghost Interviewer?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gray-50 rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="bg-teal-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8 text-teal-600" />
                </div>
                <h3 className="gi-heading-3 mb-2">Practice Anywhere</h3>
                <p className="gi-body">Get interview-ready at your own pace, anytime.</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="bg-teal-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-8 h-8 text-teal-600" />
                </div>
                <h3 className="gi-heading-3 mb-2">Instant Feedback</h3>
                <p className="gi-body">Receive AI-powered feedback on your responses.</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="bg-teal-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <HelpCircle className="w-8 h-8 text-teal-600" />
                </div>
                <h3 className="gi-heading-3 mb-2">Learn & Improve</h3>
                <p className="gi-body">Track your progress and enhance your skills.</p>
              </div>
            </div>
          </div>

          <button
            onClick={onShowConfiguration}
            className="gi-btn-primary inline-flex items-center px-10 py-5 text-xl font-bold hover:shadow-2xl hover:-translate-y-0.5"
          >
            Get Started
            <ArrowRight className="ml-3 w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
}