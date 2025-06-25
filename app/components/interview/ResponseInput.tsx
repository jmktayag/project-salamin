'use client';

import React from 'react';
import { Mic, AlertCircle } from 'lucide-react';
import { VoiceStatus } from '../../types/speech';

interface ResponseInputProps {
  response: string;
  onResponseChange: (value: string) => void;
  voiceStatus: VoiceStatus;
  onToggleListening: () => void;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
}

export function ResponseInput({ 
  response, 
  onResponseChange, 
  voiceStatus, 
  onToggleListening, 
  textareaRef 
}: ResponseInputProps) {
  const handleResponseChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onResponseChange(e.target.value);
  };

  return (
    <div className="mt-6 space-y-4">
      <div className="flex items-start justify-between">
        <label htmlFor="response" className="block text-sm font-medium gi-text-secondary">
          Your Response
        </label>
      </div>

      {/* Response Input */}
      <div className="relative">
        <textarea
          ref={textareaRef}
          id="response"
          value={response}
          onChange={handleResponseChange}
          className="gi-textarea w-full min-h-[56px] pt-4 pl-4 pr-4 pb-12 text-base sm:text-lg resize-none overflow-y-auto"
          placeholder="Type your response here..."
          aria-label="Your interview response"
          rows={1}
          style={{ height: '56px' }}
        />
        
        {/* Microphone Button - Inside textarea */}
        <button
          type="button"
          onClick={onToggleListening}
          disabled={voiceStatus === 'processing'}
          className={`absolute bottom-3 right-3 w-8 h-8 rounded-full border-2 transition-all duration-500 focus:outline-none ${
            voiceStatus === 'recording' 
              ? 'border-red-500 bg-red-500 hover:bg-red-600 animate-pulse shadow-lg shadow-red-500/50 focus:ring-2 focus:ring-red-400' 
              : voiceStatus === 'processing'
              ? 'border-blue-400 bg-blue-50 cursor-not-allowed animate-pulse shadow-lg shadow-blue-400/30'
              : voiceStatus === 'error'
              ? 'border-red-300 bg-red-50 hover:bg-red-100 focus:ring-2 focus:ring-red-400'
              : 'border-gray-300 bg-white hover:bg-gray-50 hover:border-teal-600 focus:ring-2 focus:ring-teal-500'
          } flex items-center justify-center`}
          aria-label={
            voiceStatus === 'recording' ? 'Stop recording' :
            voiceStatus === 'processing' ? 'Transcribing your speech...' :
            voiceStatus === 'error' ? 'Speech recognition failed - click to try again' :
            'Start voice input'
          }
          aria-pressed={voiceStatus === 'recording'}
          title={
            voiceStatus === 'recording' ? 'Stop recording' :
            voiceStatus === 'processing' ? 'Transcribing your speech...' :
            voiceStatus === 'error' ? 'Speech recognition failed - click to try again' :
            'Start voice input'
          }
        >
          {voiceStatus === 'recording' ? (
            <Mic className="w-4 h-4 text-white" />
          ) : voiceStatus === 'processing' ? (
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          ) : voiceStatus === 'error' ? (
            <Mic className="w-4 h-4 text-red-600" />
          ) : (
            <Mic className="w-4 h-4 text-gray-600" />
          )}
        </button>
      </div>

      {/* Error Status Message */}
      {voiceStatus === 'error' && (
        <div className="flex items-center gap-2 text-sm text-red-600 mt-2">
          <AlertCircle className="w-4 h-4" />
          <span>Speech recognition failed. Click the microphone to try again.</span>
        </div>
      )}

      {/* Speech Recognition Disclaimer */}
      <div className="flex items-center justify-between mt-2">
        <p className="text-xs text-gray-500">
          💡 Tip: Speak clearly and pause between sentences for best results
        </p>
      </div>
    </div>
  );
}