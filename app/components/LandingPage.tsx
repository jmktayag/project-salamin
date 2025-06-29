'use client';

import React from 'react';
import { 
  PlayCircle, 
  Brain, 
  Mic, 
  Volume2, 
  TrendingUp, 
  Users, 
  Award, 
  Star,
  ArrowRight,
  CheckCircle,
  Shield,
  Zap,
  Target,
  MessageSquare
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { trackLandingPageViewed, trackLandingPageAction } from '../lib/firebase/analytics';
import { useEffect } from 'react';
import { Button } from './ui/Button';

interface LandingPageProps {
  onStartInterview: () => void;
  onShowDemo?: () => void;
}

export default function LandingPage({ onStartInterview, onShowDemo }: LandingPageProps) {
  const { user } = useAuth();

  // Track landing page view
  useEffect(() => {
    trackLandingPageViewed({ 
      user_type: user ? 'authenticated' : 'anonymous' 
    });
  }, [user]);

  const handleStartInterview = () => {
    trackLandingPageAction({ 
      action_type: 'start_interview_cta', 
      section: 'hero' 
    });
    onStartInterview();
  };

  const handleFinalCTA = () => {
    trackLandingPageAction({ 
      action_type: 'start_interview_cta', 
      section: 'final_cta' 
    });
    onStartInterview();
  };

  const handleDemo = () => {
    if (onShowDemo) {
      trackLandingPageAction({ 
        action_type: 'watch_demo', 
        section: 'hero' 
      });
      onShowDemo();
    }
  };

  return (
    <div className="min-h-screen gi-gradient-bg">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary to-secondary opacity-90"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 lg:pt-32 lg:pb-24">
          <div className="text-center">
            <h1 className="gi-heading-1 text-white mb-6 text-4xl md:text-6xl leading-tight">
              Master Your Next 
              <span className="text-accent"> Interview</span>
              <br />
              with AI-Powered Practice
            </h1>
            
            <p className="gi-body-large text-primary-100 mb-8 max-w-3xl mx-auto text-xl md:text-2xl">
              Get personalized feedback, improve your responses, and boost your confidence 
              with our intelligent interview simulator powered by advanced AI.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <Button
                onClick={handleStartInterview}
                variant="accent"
                size="lg"
                className="text-lg px-8 py-4"
              >
                <PlayCircle className="w-6 h-6" />
                Start Free Practice Interview
              </Button>
              
              {onShowDemo && (
                <Button
                  onClick={handleDemo}
                  variant="outline"
                  size="lg"
                  className="text-lg px-8 py-4 border-white text-white hover:bg-white hover:text-primary"
                >
                  <MessageSquare className="w-6 h-6" />
                  Watch Demo
                </Button>
              )}
            </div>
            
            <div className="flex flex-wrap justify-center items-center gap-8 text-primary-100">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-success-500" />
                <span className="gi-body">No Credit Card Required</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-success-500" />
                <span className="gi-body">Instant AI Feedback</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-success-500" />
                <span className="gi-body">Practice Unlimited</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Animated Background Elements */}
        <div className="absolute top-1/4 left-10 w-72 h-72 bg-accent rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute top-1/3 right-10 w-72 h-72 bg-secondary rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-primary rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </section>

      {/* Social Proof Section */}
      <section className="py-16 bg-bg-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="gi-heading-2 mb-4">
              Trusted by Job Seekers at Top Companies
            </h2>
            <p className="gi-body-large max-w-2xl mx-auto">
              Join thousands of professionals who've improved their interview skills and landed their dream jobs.
            </p>
          </div>
          
          {/* Success Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-16">
            <div className="text-center">
              <div className="gi-heading-1 text-primary mb-2">15K+</div>
              <div className="gi-body-small">Interviews Completed</div>
            </div>
            <div className="text-center">
              <div className="gi-heading-1 text-secondary mb-2">92%</div>
              <div className="gi-body-small">Success Rate</div>
            </div>
            <div className="text-center">
              <div className="gi-heading-1 text-success mb-2">4.8/5</div>
              <div className="gi-body-small">Average Rating</div>
            </div>
            <div className="text-center">
              <div className="gi-heading-1 text-accent-dark mb-2">500+</div>
              <div className="gi-body-small">Companies Hiring</div>
            </div>
          </div>
          
          {/* Testimonials */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div className="gi-card p-6">
              <div className="flex items-center mb-4">
                {Array.from({ length: 5 }, (_, i) => (
                  <Star key={i} className="w-5 h-5 text-accent fill-current" />
                ))}
              </div>
              <p className="gi-body mb-4">
                "Salamin helped me practice for my Google interview. The AI feedback was incredibly detailed and helped me identify areas I never knew I needed to improve."
              </p>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white font-semibold">
                  SK
                </div>
                <div className="ml-3">
                  <div className="gi-label">Sarah Kim</div>
                  <div className="gi-body-small">Software Engineer at Google</div>
                </div>
              </div>
            </div>
            
            <div className="gi-card p-6">
              <div className="flex items-center mb-4">
                {Array.from({ length: 5 }, (_, i) => (
                  <Star key={i} className="w-5 h-5 text-accent fill-current" />
                ))}
              </div>
              <p className="gi-body mb-4">
                "The speech recognition feature made practicing feel so natural. I went from nervous wreck to confident interviewee in just a few sessions."
              </p>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-success rounded-full flex items-center justify-center text-white font-semibold">
                  MJ
                </div>
                <div className="ml-3">
                  <div className="gi-label">Michael Johnson</div>
                  <div className="gi-body-small">Product Manager at Microsoft</div>
                </div>
              </div>
            </div>
            
            <div className="gi-card p-6">
              <div className="flex items-center mb-4">
                {Array.from({ length: 5 }, (_, i) => (
                  <Star key={i} className="w-5 h-5 text-accent fill-current" />
                ))}
              </div>
              <p className="gi-body mb-4">
                "Amazing platform! The behavioral and technical question mix perfectly prepared me for my Amazon interview. Highly recommend!"
              </p>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center text-white font-semibold">
                  AC
                </div>
                <div className="ml-3">
                  <div className="gi-label">Amanda Chen</div>
                  <div className="gi-body-small">Data Scientist at Amazon</div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Company Logos */}
          <div className="text-center">
            <p className="gi-body-small mb-8">Our users have been hired at:</p>
            <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
              <div className="gi-heading-4 text-text-muted">Google</div>
              <div className="gi-heading-4 text-text-muted">Microsoft</div>
              <div className="gi-heading-4 text-text-muted">Amazon</div>
              <div className="gi-heading-4 text-text-muted">Meta</div>
              <div className="gi-heading-4 text-text-muted">Apple</div>
              <div className="gi-heading-4 text-text-muted">Netflix</div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights Section */}
      <section className="py-16 bg-bg-secondary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="gi-heading-2 mb-4">
              Everything You Need to Ace Your Interview
            </h2>
            <p className="gi-body-large max-w-2xl mx-auto">
              Our AI-powered platform provides comprehensive interview preparation with real-time feedback.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {/* AI-Powered Feedback */}
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Brain className="w-8 h-8 text-primary" />
              </div>
              <h3 className="gi-heading-3 mb-4">AI-Powered Feedback</h3>
              <p className="gi-body leading-relaxed">
                Get instant, detailed feedback on your responses with our advanced AI analysis. 
                Improve your communication, identify strengths, and fix weaknesses in real-time.
              </p>
            </div>
            
            {/* Speech Recognition & TTS */}
            <div className="text-center">
              <div className="w-16 h-16 bg-success-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Mic className="w-8 h-8 text-success" />
              </div>
              <h3 className="gi-heading-3 mb-4">Natural Speech Practice</h3>
              <p className="gi-body leading-relaxed">
                Practice speaking your answers with our speech recognition technology. 
                Hear questions read aloud and get comfortable with verbal communication.
              </p>
            </div>
            
            {/* Multiple Interview Types */}
            <div className="text-center">
              <div className="w-16 h-16 bg-secondary-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Target className="w-8 h-8 text-secondary" />
              </div>
              <h3 className="gi-heading-3 mb-4">Tailored Questions</h3>
              <p className="gi-body leading-relaxed">
                Choose from behavioral, technical, or mixed interview types. 
                Questions are customized for your specific role and industry.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Credibility Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Your Success, Our Priority
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              We're committed to your privacy, security, and interview success.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Secure & Private</h3>
              <p className="text-gray-600 text-sm">Your data is encrypted and never shared with third parties.</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">No Credit Card</h3>
              <p className="text-gray-600 text-sm">Start practicing immediately without any payment information.</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Instant Access</h3>
              <p className="text-gray-600 text-sm">Begin your interview practice within seconds of signing up.</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Proven Results</h3>
              <p className="text-gray-600 text-sm">92% of users report improved interview confidence.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-16 bg-gradient-to-r from-primary to-secondary">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="gi-heading-2 text-white mb-4">
            Ready to Ace Your Next Interview?
          </h2>
          <p className="gi-body-large text-primary-100 mb-8">
            Join thousands of successful candidates who've mastered their interview skills with Salamin.
          </p>
          
          <Button
            onClick={handleFinalCTA}
            variant="accent"
            size="lg"
            className="text-lg px-8 py-4"
          >
            <PlayCircle className="w-6 h-6" />
            Start Your Free Interview Practice
            <ArrowRight className="w-6 h-6" />
          </Button>
          
          <div className="mt-6 text-primary-100 gi-body-small">
            No credit card required • Instant access • 100% free
          </div>
        </div>
      </section>
    </div>
  );
}