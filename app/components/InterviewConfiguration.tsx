'use client';

import React, { useState, useCallback } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, AlertCircle, HelpCircle } from 'lucide-react';
import { InterviewConfiguration as IInterviewConfiguration, InterviewType, INTERVIEW_TYPE_OPTIONS } from '../types/interview';

interface InterviewConfigurationProps {
  onStartInterview: (config: IInterviewConfiguration) => void;
  onBack: () => void;
}

export default function InterviewConfiguration({
  onStartInterview,
  onBack,
}: InterviewConfigurationProps) {
  const [position, setPosition] = useState('');
  const [interviewType, setInterviewType] = useState<InterviewType | ''>('');
  const [errors, setErrors] = useState<{ position?: string; interviewType?: string }>({});

  const validateForm = useCallback(() => {
    const newErrors: { position?: string; interviewType?: string } = {};

    if (!position.trim()) {
      newErrors.position = 'Position is required';
    } else if (position.trim().length < 2) {
      newErrors.position = 'Position must be at least 2 characters';
    }

    if (!interviewType) {
      newErrors.interviewType = 'Interview type is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [position, interviewType]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onStartInterview({
        position: position.trim(),
        interviewType: interviewType as InterviewType,
      });
    }
  }, [position, interviewType, validateForm, onStartInterview]);

  const handlePositionChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setPosition(e.target.value);
    if (errors.position) {
      setErrors(prev => ({ ...prev, position: undefined }));
    }
  }, [errors.position]);

  const handleInterviewTypeChange = useCallback((value: InterviewType) => {
    setInterviewType(value);
    if (errors.interviewType) {
      setErrors(prev => ({ ...prev, interviewType: undefined }));
    }
  }, [errors.interviewType]);

  const isFormValid = position.trim() && interviewType;

  const getInterviewTypeIcon = (type: InterviewType) => {
    switch (type) {
      case 'behavioral':
        return <HelpCircle className="w-5 h-5" />;
      case 'technical':
        return <CheckCircle2 className="w-5 h-5" />;
      case 'mixed':
        return <AlertCircle className="w-5 h-5" />;
    }
  };

  return (
    <div className="min-h-screen gi-gradient-bg">
      <div className="max-w-4xl mx-auto px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Configure Your Interview
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Let&apos;s customize your interview experience to match your specific needs and goals.
          </p>
        </div>

        <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Position Input */}
            <div className="space-y-4">
              <div>
                <label 
                  htmlFor="position" 
                  className="block text-lg font-semibold text-gray-900 mb-2"
                >
                  What position are you applying for?
                </label>
                <p className="text-sm text-gray-600 mb-4">
                  This helps us tailor the interview questions to your specific role.
                </p>
                <input
                  type="text"
                  id="position"
                  value={position}
                  onChange={handlePositionChange}
                  placeholder="Enter the position you're applying for"
                  className={`w-full px-4 py-3 rounded-lg border-2 text-lg transition-colors focus:outline-none ${
                    errors.position
                      ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                      : 'border-gray-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-200'
                  }`}
                  aria-describedby={errors.position ? 'position-error' : undefined}
                />
                {errors.position && (
                  <p id="position-error" className="mt-2 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.position}
                  </p>
                )}
              </div>
            </div>

            {/* Interview Type Selection */}
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  What type of interview would you like to practice?
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Choose the interview format that best matches your preparation needs.
                </p>
              </div>

              <div className="space-y-3">
                {INTERVIEW_TYPE_OPTIONS.map((option) => (
                  <label
                    key={option.value}
                    className={`flex items-start gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all hover:bg-gray-50 ${
                      interviewType === option.value
                        ? 'border-teal-500 bg-teal-50'
                        : 'border-gray-200'
                    }`}
                  >
                    <input
                      type="radio"
                      name="interviewType"
                      value={option.value}
                      checked={interviewType === option.value}
                      onChange={() => handleInterviewTypeChange(option.value)}
                      className="sr-only"
                    />
                    <div className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      interviewType === option.value
                        ? 'border-teal-500 bg-teal-500'
                        : 'border-gray-300'
                    }`}>
                      {interviewType === option.value && (
                        <div className="w-2 h-2 bg-white rounded-full" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <div className={`p-1 rounded ${
                          interviewType === option.value ? 'text-teal-600' : 'text-gray-500'
                        }`}>
                          {getInterviewTypeIcon(option.value)}
                        </div>
                        <span className="font-semibold text-gray-900">
                          {option.label}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        {option.description}
                      </p>
                    </div>
                  </label>
                ))}
              </div>

              {errors.interviewType && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.interviewType}
                </p>
              )}
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onBack}
                className="inline-flex items-center px-6 py-3 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-gray-400 focus:outline-none transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </button>

              <button
                type="submit"
                disabled={!isFormValid}
                className={`inline-flex items-center px-8 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                  isFormValid
                    ? 'gi-btn-primary'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed rounded-lg'
                }`}
              >
                Start Interview
                <ArrowRight className="w-4 h-4 ml-2" />
              </button>
            </div>
          </form>
        </div>

        {/* Progress Indicator */}
        <div className="max-w-2xl mx-auto mt-8">
          <div className="flex items-center justify-center space-x-4 text-sm text-gray-600">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-teal-600 text-white rounded-full flex items-center justify-center font-semibold">
                ✓
              </div>
              <span className="ml-2">Welcome</span>
            </div>
            <div className="w-8 h-px bg-gray-300"></div>
            <div className="flex items-center">
              <div className="w-8 h-8 bg-teal-600 text-white rounded-full flex items-center justify-center font-semibold">
                2
              </div>
              <span className="ml-2 font-medium">Configuration</span>
            </div>
            <div className="w-8 h-px bg-gray-300"></div>
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gray-300 text-gray-600 rounded-full flex items-center justify-center">
                3
              </div>
              <span className="ml-2">Interview</span>
            </div>
            <div className="w-8 h-px bg-gray-300"></div>
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gray-300 text-gray-600 rounded-full flex items-center justify-center">
                4
              </div>
              <span className="ml-2">Summary</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}