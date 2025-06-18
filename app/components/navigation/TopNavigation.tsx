'use client';

import React from 'react';
import { BookOpen } from 'lucide-react';
import { useNavigation } from './NavigationProvider';

export default function TopNavigation() {
  const { resetToHome } = useNavigation();

  const handleLogoClick = () => {
    resetToHome();
  };



  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-center items-center h-16">
          {/* Brand Section */}
          <button
            onClick={handleLogoClick}
            className="flex items-center space-x-2 text-xl font-bold text-gray-900 hover:text-primary transition-colors duration-200"
            aria-label="Ghost Interviewer Home"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary-dark rounded-lg flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <span>Ghost Interviewer</span>
          </button>
        </div>
      </div>

    </nav>
  );
}