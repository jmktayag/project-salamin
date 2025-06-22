import React from 'react';
import { 
  CheckCircle, 
  AlertCircle, 
  Lightbulb, 
  Trophy,
  Star,
  Target,
  ArrowRight,
  FileText,
  BookOpen,
  MessageSquare
} from 'lucide-react';
import type { InterviewAnalysis } from '../utils/InterviewAnalysisService';
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

  const parseMarkdownText = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        const boldText = part.slice(2, -2);
        return <strong key={index} className="font-semibold">{boldText}</strong>;
      }
      return part;
    });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] gi-gradient-bg p-6">
      <div className="w-full max-w-xl gi-card-lg p-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-teal-50 rounded-full mb-4">
            <Trophy className="w-8 h-8 text-teal-600" />
          </div>
          <h2 className="gi-heading-2 mb-2">Interview Complete</h2>
          <p className="gi-body-large">
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
            <h3 className="gi-heading-3">Overall Assessment</h3>
          </div>
          <p className="gi-body leading-relaxed">{parseMarkdownText(summary)}</p>
        </div>

        {/* Score and Verdict */}
        <div className="mb-8">
          <div className="grid grid-cols-2 gap-4">
            {/* Score Card */}
            <div className="p-4 bg-gray-50 rounded-lg text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-teal-50 rounded-full mb-2">
                <Target className="w-6 h-6 text-teal-600" />
              </div>
              <h3 className="text-sm font-medium gi-text-muted mb-1">Final Score</h3>
              <p className="text-3xl font-bold gi-text-primary">{score}/100</p>
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
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-50 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <h3 className="gi-heading-3 text-slate-800">What You Did Well</h3>
            <div className="flex-1 h-px bg-green-200"></div>
          </div>
          {strengths.length > 0 ? (
            <ul className="space-y-3" role="list" aria-label="Areas where you excelled">
              {strengths.map((strength, index) => (
                <li key={index} className="flex items-start gap-3 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-emerald-200">
                  <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mt-0.5">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  </div>
                  <span className="gi-body leading-relaxed text-slate-700">{parseMarkdownText(strength)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center p-6 bg-gray-50 rounded-xl border border-gray-200">
              <BookOpen className="w-8 h-8 text-gray-500 mx-auto mb-2" />
              <p className="text-gray-700 font-medium mb-1">Building Your Foundation</p>
              <p className="text-sm text-gray-600">Every expert was once a beginner. Keep practicing to discover your strengths!</p>
            </div>
          )}
        </div>


        {/* Action Steps */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-violet-50 rounded-lg">
              <Lightbulb className="w-5 h-5 text-violet-600" />
            </div>
            <h3 className="gi-heading-3 text-slate-800">Your Next Steps</h3>
            <div className="flex-1 h-px bg-violet-200"></div>
          </div>
          {suggestions.length > 0 ? (
            <ul className="space-y-3" role="list" aria-label="Recommended next steps">
              {suggestions.map((suggestion, index) => (
                <li key={index} className="flex items-start gap-3 p-4 bg-gradient-to-r from-violet-50 to-purple-50 rounded-xl border border-violet-100">
                  <div className="flex-shrink-0 w-6 h-6 bg-violet-100 rounded-full flex items-center justify-center mt-0.5">
                    <span className="text-violet-600 font-semibold text-sm">{index + 1}</span>
                  </div>
                  <span className="gi-body leading-relaxed text-slate-700">{parseMarkdownText(suggestion)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center p-6 bg-gradient-to-r from-violet-50 to-purple-50 rounded-xl border border-violet-200">
              <Lightbulb className="w-8 h-8 text-violet-500 mx-auto mb-2" />
              <p className="text-slate-600 font-medium mb-1">Keep Growing</p>
              <p className="text-sm text-slate-500">Continue practicing with different interview types to build confidence!</p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3">
          <button
            onClick={onNewInterview}
            className="w-full gi-btn-primary inline-flex items-center justify-center gap-2 px-6 py-3 focus:ring-2 focus:ring-teal-500 focus:outline-none"
          >
            Start New Interview
            <ArrowRight className="w-4 h-4" />
          </button>
          
          {/* Survey Feedback Button */}
          <a
            href="https://docs.google.com/forms/d/e/1FAIpQLSdVk0uOAyB05OmLt4DZR4Hq0Ztfv1kktm0jq6dLB9qu1jpLAA/viewform?usp=header"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-colors font-medium shadow-lg"
            style={{ minHeight: '48px' }}
          >
Help Us Improve
            <MessageSquare className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  );
} 