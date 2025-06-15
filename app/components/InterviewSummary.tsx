import React from 'react';
import { CheckCircle, AlertCircle, Lightbulb, Award } from 'lucide-react';
import type { InterviewAnalysis } from '../utils/InterviewAnalyzer';

interface InterviewSummaryProps extends InterviewAnalysis {}

export function InterviewSummary({
  strengths,
  weaknesses,
  suggestions,
  score,
  verdict,
  summary,
}: InterviewSummaryProps) {
  const getVerdictColor = (verdict: string) => {
    switch (verdict) {
      case 'Strong Hire':
        return 'text-green-600';
      case 'Hire':
        return 'text-blue-600';
      case 'Weak Hire':
        return 'text-yellow-600';
      case 'No Hire':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-8">
      {/* Overall Summary */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Overall Assessment</h3>
        <p className="text-gray-600">{summary}</p>
      </div>

      {/* Score and Verdict */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold text-gray-800">Final Score</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">{score}/100</p>
          </div>
          <div className="text-right">
            <h3 className="text-xl font-semibold text-gray-800">Verdict</h3>
            <p className={`text-2xl font-bold mt-2 ${getVerdictColor(verdict)}`}>
              {verdict}
            </p>
          </div>
        </div>
      </div>

      {/* Strengths */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
          <CheckCircle className="w-6 h-6 text-green-500 mr-2" />
          Key Strengths
        </h3>
        <ul className="space-y-3">
          {strengths.map((strength, index) => (
            <li key={index} className="flex items-start">
              <span className="text-green-500 mr-2">•</span>
              <span className="text-gray-600">{strength}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Areas for Improvement */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
          <AlertCircle className="w-6 h-6 text-yellow-500 mr-2" />
          Areas for Improvement
        </h3>
        <ul className="space-y-3">
          {weaknesses.map((weakness, index) => (
            <li key={index} className="flex items-start">
              <span className="text-yellow-500 mr-2">•</span>
              <span className="text-gray-600">{weakness}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Suggestions */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
          <Lightbulb className="w-6 h-6 text-blue-500 mr-2" />
          Suggestions for Improvement
        </h3>
        <ul className="space-y-3">
          {suggestions.map((suggestion, index) => (
            <li key={index} className="flex items-start">
              <span className="text-blue-500 mr-2">•</span>
              <span className="text-gray-600">{suggestion}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
} 