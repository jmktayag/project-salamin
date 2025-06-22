'use client';

import React, { useMemo } from 'react';
import { ChevronRight, CheckCircle2 } from 'lucide-react';
import { useNavigation } from './NavigationProvider';
import { BreadcrumbItem } from './types';

export default function BreadcrumbNavigation() {
  const { interviewStep, interviewStarted } = useNavigation();

  const steps: BreadcrumbItem[] = useMemo(() => [
    {
      label: 'Setup',
      step: 'configuration',
      isActive: interviewStep === 'configuration',
      isCompleted: interviewStep === 'interview' || interviewStep === 'summary',
      isClickable: false,
    },
    {
      label: 'Interview',
      step: 'interview',
      isActive: interviewStep === 'interview',
      isCompleted: interviewStep === 'summary',
      isClickable: false,
    },
    {
      label: 'Summary',
      step: 'summary',
      isActive: interviewStep === 'summary',
      isCompleted: false,
      isClickable: false,
    },
  ], [interviewStep]);



  if (!interviewStarted) {
    return null;
  }

  const currentStepIndex = steps.findIndex(s => s.isActive);

  return (
    <nav 
      className="bg-white border-b border-gray-200 shadow-sm" 
      aria-label="Interview progress navigation"
      role="navigation"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="py-3 sm:py-4">
          <ol className="flex items-center justify-center space-x-1 sm:space-x-4 overflow-x-auto pb-2 sm:pb-0">
            {steps.map((step, index) => (
              <li key={step.step} className="flex items-center">
                <div className="flex items-center space-x-2 sm:space-x-3">
                  {/* Step Number/Icon */}
                  <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-semibold transition-all duration-300 ${
                    step.isActive 
                      ? 'bg-teal-600 text-white' 
                      : step.isCompleted 
                      ? 'bg-teal-100 text-teal-600 border-2 border-teal-600' 
                      : 'bg-gray-200 text-gray-500 border-2 border-gray-300'
                  }`}>
                    {step.isCompleted ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <span>{index + 1}</span>
                    )}
                  </div>
                  
                  {/* Step Label */}
                  <span
                    className={`text-sm font-medium ${
                      step.isActive
                        ? 'text-teal-600 font-semibold'
                        : step.isCompleted
                        ? 'text-teal-600'
                        : 'text-gray-400'
                    }`}
                    aria-current={step.isActive ? 'step' : undefined}
                    aria-label={`${step.label} step ${index + 1} of ${steps.length}. ${
                      step.isCompleted 
                        ? 'Completed' 
                        : step.isActive 
                        ? 'Currently active' 
                        : 'Not yet available'
                    }`}
                    aria-describedby={step.isActive ? `step-${step.step}-desc` : undefined}
                  >
                    <span className="hidden sm:inline">{step.label}</span>
                    <span className="sm:hidden">{step.label.slice(0, 4)}</span>
                  </span>
                </div>
                
                {index < steps.length - 1 && (
                  <ChevronRight className={`w-4 h-4 mx-2 sm:mx-3 text-gray-400 transition-colors duration-300 ${
                    step.isCompleted ? 'text-teal-400' : 'text-gray-400'
                  }`} aria-hidden="true" />
                )}
              </li>
            ))}
          </ol>
          
          {/* Mobile-only current step indicator */}
          <div className="sm:hidden mt-3 px-4">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <div className="w-6 h-6 bg-teal-600 text-white rounded-full flex items-center justify-center text-xs font-semibold">
                  {currentStepIndex + 1}
                </div>
                <span className="text-xs text-gray-600">of {steps.length}</span>
              </div>
              <div className="text-sm text-gray-800 font-medium">
                {steps.find(s => s.isActive)?.label}
              </div>
            </div>
          </div>

          {/* Hidden descriptions for screen readers */}
          {steps.map((step) => (
            step.isActive && (
              <div key={`desc-${step.step}`} id={`step-${step.step}-desc`} className="sr-only">
                You are currently on the {step.label} step. 
                {step.step === 'configuration' && 'Configure your interview settings before starting.'}
                {step.step === 'interview' && 'Answer interview questions and receive AI feedback.'}
                {step.step === 'summary' && 'Review your interview performance and get detailed analysis.'}
              </div>
            )
          ))}
        </div>
      </div>
    </nav>
  );
}