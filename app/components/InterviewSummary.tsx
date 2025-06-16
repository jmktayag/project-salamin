import React from 'react';
import { 
  CheckCircle, 
  AlertCircle, 
  Lightbulb, 
  Trophy,
  Star,
  Target,
  ArrowRight,
  FileText
} from 'lucide-react';
import type { InterviewAnalysis } from '../utils/InterviewAnalyzer';
import type { InterviewConfiguration } from '../types/interview';

interface InterviewSummaryProps extends InterviewAnalysis {
  onNewInterview: () => void;
  onReviewFeedback: () => void;
  interviewConfig?: InterviewConfiguration;
}

export function InterviewSummary({
  strengths,
  weaknesses,
  suggestions,
  score,
  verdict,
  summary,
  onNewInterview,
  onReviewFeedback,
  interviewConfig,
}: InterviewSummaryProps) {
  const getVerdictColor = (verdict: string) => {
    switch (verdict) {
      case 'Strong Hire':
        return 'text-green-600 bg-green-50';
      case 'Hire':
        return 'text-blue-600 bg-blue-50';
      case 'Weak Hire':
        return 'text-yellow-600 bg-yellow-50';
      case 'No Hire':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] p-6">
      <div className="w-full max-w-xl bg-white rounded-xl shadow-md p-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-teal-50 rounded-full mb-4">
            <Trophy className="w-8 h-8 text-teal-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Interview Complete</h2>
          <p className="text-lg text-gray-600">
            {interviewConfig 
              ? `Here's your comprehensive analysis for the ${interviewConfig.position} ${interviewConfig.interviewType} interview`
              : "Here's your comprehensive analysis"
            }
          </p>
          {interviewConfig && (
            <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-full text-sm text-gray-600">
              <span className="font-medium">{interviewConfig.position}</span>
              <span>•</span>
              <span className="capitalize">{interviewConfig.interviewType} Interview</span>
            </div>
          )}
        </div>

        {/* Overall Summary */}
        <div className="mb-8 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-800">Overall Assessment</h3>
          </div>
          <p className="text-gray-600 leading-relaxed text-base">{summary}</p>
        </div>

        {/* Score and Verdict */}
        <div className="mb-8">
          <div className="grid grid-cols-2 gap-4">
            {/* Score Card */}
            <div className="p-4 bg-gray-50 rounded-lg text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-teal-50 rounded-full mb-2">
                <Target className="w-6 h-6 text-teal-600" />
              </div>
              <h3 className="text-sm font-medium text-gray-600 mb-1">Final Score</h3>
              <p className="text-3xl font-bold text-gray-900">{score}/100</p>
            </div>

            {/* Verdict Card */}
            <div className={`p-4 rounded-lg text-center ${getVerdictColor(verdict)}`}>
              <div className="inline-flex items-center justify-center w-12 h-12 bg-white/50 rounded-full mb-2">
                <Star className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-medium mb-1">Verdict</h3>
              <p className="text-2xl font-bold">{verdict}</p>
            </div>
          </div>
        </div>

        {/* Strengths */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 bg-green-50 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800">Key Strengths</h3>
          </div>
          {strengths.length > 0 ? (
            <ul className="space-y-2">
              {strengths.map((strength, index) => (
                <li key={index} className="flex items-start gap-2 p-2 bg-green-50/50 rounded-lg">
                  <span className="text-green-600 mt-1">•</span>
                  <span className="text-gray-600 leading-relaxed text-base">{strength}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-400 italic text-center p-4 bg-gray-50 rounded-lg">
              No notable strengths were identified.
            </p>
          )}
        </div>

        {/* Areas for Improvement */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 bg-yellow-50 rounded-lg">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800">Areas for Improvement</h3>
          </div>
          {weaknesses.length > 0 ? (
            <ul className="space-y-2">
              {weaknesses.map((weakness, index) => (
                <li key={index} className="flex items-start gap-2 p-2 bg-yellow-50/50 rounded-lg">
                  <span className="text-yellow-600 mt-1">•</span>
                  <span className="text-gray-600 leading-relaxed text-base">{weakness}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-400 italic text-center p-4 bg-gray-50 rounded-lg">
              No specific areas for improvement were identified.
            </p>
          )}
        </div>

        {/* Suggestions */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Lightbulb className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800">Suggestions for Improvement</h3>
          </div>
          {suggestions.length > 0 ? (
            <ul className="space-y-2">
              {suggestions.map((suggestion, index) => (
                <li key={index} className="flex items-start gap-2 p-2 bg-blue-50/50 rounded-lg">
                  <span className="text-blue-600 mt-1">•</span>
                  <span className="text-gray-600 leading-relaxed text-base">{suggestion}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-400 italic text-center p-4 bg-gray-50 rounded-lg">
              No specific suggestions were provided.
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3">
          <button
            onClick={onNewInterview}
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 focus:ring-2 focus:ring-teal-500 focus:outline-none transition-colors"
          >
            Start New Interview
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={onReviewFeedback}
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 border border-gray-300 text-gray-800 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-gray-400 focus:outline-none transition-colors"
          >
            Review All Feedback
            <FileText className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
} 