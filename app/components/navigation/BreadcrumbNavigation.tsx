'use client';

import React from 'react';
import { ChevronRight, Settings, MessageSquare, BarChart3 } from 'lucide-react';
import { useNavigation } from './NavigationProvider';
import { BreadcrumbItem, InterviewStep } from './types';

export default function BreadcrumbNavigation() {
  const { interviewStep, setInterviewStep, interviewStarted } = useNavigation();

  if (!interviewStarted) {
    return null;
  }

  const steps: BreadcrumbItem[] = [
    {
      label: 'Setup',
      step: 'configuration',
      isActive: interviewStep === 'configuration',
      isCompleted: interviewStep === 'interview' || interviewStep === 'summary',
      isClickable: interviewStep === 'interview' || interviewStep === 'summary',
    },
    {
      label: 'Interview',
      step: 'interview',
      isActive: interviewStep === 'interview',
      isCompleted: interviewStep === 'summary',
      isClickable: interviewStep === 'summary',
    },
    {
      label: 'Summary',
      step: 'summary',
      isActive: interviewStep === 'summary',
      isCompleted: false,
      isClickable: false,
    },
  ];

  const getStepIcon = (step: InterviewStep) => {
    switch (step) {
      case 'configuration':
        return <Settings className="w-4 h-4" />;
      case 'interview':
        return <MessageSquare className="w-4 h-4" />;
      case 'summary':
        return <BarChart3 className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const handleStepClick = (step: InterviewStep, isClickable: boolean) => {
    if (isClickable) {
      setInterviewStep(step);
    }
  };

  return (
    <nav className="bg-gray-50 border-b border-gray-200" aria-label="Interview progress">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-3">
          <ol className="flex items-center space-x-2 sm:space-x-4">
            {steps.map((step, index) => (
              <li key={step.step} className="flex items-center">
                <button
                  onClick={() => handleStepClick(step.step, step.isClickable)}
                  disabled={!step.isClickable}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                    step.isActive
                      ? 'bg-primary text-white'
                      : step.isCompleted
                      ? 'text-primary hover:bg-primary/10'
                      : step.isClickable
                      ? 'text-gray-700 hover:text-primary hover:bg-gray-100'
                      : 'text-gray-400 cursor-not-allowed'
                  }`}
                  aria-current={step.isActive ? 'step' : undefined}
                  aria-label={`${step.label} ${step.isCompleted ? '(completed)' : step.isActive ? '(current)' : ''}`}
                >
                  <span className={`${step.isActive ? 'text-white' : step.isCompleted ? 'text-primary' : 'text-gray-400'}`}>
                    {getStepIcon(step.step)}
                  </span>
                  <span className="hidden sm:block">{step.label}</span>
                </button>
                
                {index < steps.length - 1 && (
                  <ChevronRight className="w-4 h-4 text-gray-400 mx-2 flex-shrink-0" aria-hidden="true" />
                )}
              </li>
            ))}
          </ol>
          
          {/* Mobile-only current step indicator */}
          <div className="sm:hidden mt-2">
            <div className="text-xs text-gray-600">
              Step {steps.findIndex(s => s.isActive) + 1} of {steps.length}: {steps.find(s => s.isActive)?.label}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}