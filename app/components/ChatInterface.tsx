'use client';

import React, { useState } from 'react';
import { Mic, Send } from 'lucide-react';

/**
 * Represents a message in the chat interface
 */
type Message = {
  /** Unique identifier for the message */
  id: string;
  /** Content of the message */
  content: string;
  /** Who sent the message (ghost AI or user) */
  sender: 'ghost' | 'user';
  /** When the message was sent */
  timestamp: Date;
};

/**
 * Available feedback tabs in the interface
 */
type FeedbackTab = 'behavioral' | 'emotional' | 'strategic';

/**
 * ChatInterface component that provides an AI-powered interview experience
 * with real-time chat interaction and feedback
 */
export default function ChatInterface() {
  // State management
  const [isInterviewStarted, setIsInterviewStarted] = useState(false);
  const [isInterviewComplete, setIsInterviewComplete] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [activeTab, setActiveTab] = useState<FeedbackTab>('behavioral');

  /**
   * Initializes a new interview session with a welcome message
   */
  const handleStartInterview = () => {
    setIsInterviewStarted(true);
    // Add initial ghost message
    setMessages([
      {
        id: '1',
        content: 'Hello! I\'m your AI Ghost Interviewer. I\'ll be asking you some questions today. Are you ready to begin?',
        sender: 'ghost',
        timestamp: new Date(),
      },
    ]);
  };

  /**
   * Handles sending a new message and simulates ghost response
   */
  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, newMessage]);
    setInputMessage('');

    // Simulate ghost response (replace with actual AI integration)
    setTimeout(() => {
      const ghostResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: 'That\'s an interesting perspective. Could you elaborate more on that?',
        sender: 'ghost',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, ghostResponse]);
    }, 1000);
  };

  // Render welcome screen if interview hasn't started
  if (!isInterviewStarted) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full text-center space-y-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
            Ghost Interviewer 👻
          </h1>
          <p className="text-xl text-gray-600">
            Practice interviews. Reflect deeply. Get better.
          </p>
          <button
            onClick={handleStartInterview}
            className="bg-primary hover:bg-primary-dark text-white font-semibold py-3 px-8 rounded-2xl shadow-md transition-colors"
          >
            Start Interview
          </button>
        </div>
      </div>
    );
  }

  // Render completion screen if interview is finished
  if (isInterviewComplete) {
    return (
      <div className="min-h-screen bg-gray-100 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-md p-6">
            <div className="flex space-x-4 border-b mb-6">
              {(['behavioral', 'emotional', 'strategic'] as FeedbackTab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 font-medium capitalize ${
                    activeTab === tab
                      ? 'text-primary border-b-2 border-primary'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
            
            <div className="space-y-4">
              {/* Placeholder feedback cards - replace with actual feedback */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="font-semibold text-lg mb-2">Communication Style</h3>
                <p className="text-gray-600">
                  Your responses demonstrated clear and structured communication. Consider adding more specific examples to strengthen your points.
                </p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="font-semibold text-lg mb-2">Body Language</h3>
                <p className="text-gray-600">
                  Maintained good eye contact and posture throughout the interview. Work on reducing filler words.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render main chat interface
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl p-4 shadow-md ${
                message.sender === 'user'
                  ? 'bg-primary text-white'
                  : 'bg-white text-gray-800'
              }`}
            >
              {message.content}
            </div>
          </div>
        ))}
      </div>

      <div className="border-t bg-white p-4">
        <div className="max-w-4xl mx-auto flex items-center space-x-4">
          <button className="p-2 text-gray-500 hover:text-gray-700">
            <Mic className="w-6 h-6" />
          </button>
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Type your response..."
            className="flex-1 border rounded-2xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          />
          <button
            onClick={handleSendMessage}
            className="p-2 text-primary hover:text-primary-dark"
          >
            <Send className="w-6 h-6" />
          </button>
          <button
            onClick={() => setIsInterviewComplete(true)}
            className="ml-auto px-4 py-2 bg-gray-200 rounded-2xl text-gray-700 hover:bg-gray-300"
          >
            Finish Interview
          </button>
        </div>
      </div>
    </div>
  );
}
