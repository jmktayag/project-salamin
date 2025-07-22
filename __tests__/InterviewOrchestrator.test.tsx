import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import InterviewOrchestrator from '@/app/components/InterviewOrchestrator';

// Mock environment variables
const mockEnv = {
  NEXT_PUBLIC_GEMINI_API_KEY: 'test-api-key'
};

Object.defineProperty(process, 'env', {
  value: mockEnv
});

// Mock the AI service classes
jest.mock('@/app/utils/InterviewFeedbackService', () => ({
  InterviewFeedbackService: jest.fn().mockImplementation(() => ({
    generateFeedback: jest.fn().mockResolvedValue([
      { type: 'success', text: 'Good response structure' },
      { type: 'warning', text: 'Could be more detailed' },
      { type: 'suggestion', text: 'Use specific examples' }
    ])
  }))
}));

jest.mock('@/app/utils/InterviewAnalysisService', () => ({
  InterviewAnalysisService: jest.fn().mockImplementation(() => ({
    analyzeInterview: jest.fn().mockResolvedValue({
      strengths: ['Clear communication'],
      weaknesses: ['Needs more detail'],
      suggestions: ['Practice STAR method'],
      score: 85,
      verdict: 'Hire',
      summary: 'Good candidate overall'
    })
  }))
}));

jest.mock('@/app/utils/TextToSpeechService', () => ({
  TextToSpeechService: jest.fn().mockImplementation(() => ({
    generateSpeech: jest.fn().mockResolvedValue(new ArrayBuffer(8))
  }))
}));

// Mock Web Speech API
Object.defineProperty(window, 'SpeechRecognition', {
  writable: true,
  value: jest.fn().mockImplementation(() => ({
    start: jest.fn(),
    stop: jest.fn(),
    onresult: null,
    onend: null
  }))
});

Object.defineProperty(window, 'SpeechRecognition', {
  writable: true,
  value: jest.fn().mockImplementation(() => ({
    start: jest.fn(),
    stop: jest.fn(),
    abort: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn()
  }))
});

Object.defineProperty(window, 'webkitSpeechRecognition', {
  writable: true,
  value: (window as any).SpeechRecognition
});

describe('InterviewOrchestrator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Initial State', () => {
    it('renders hero page when interview not started', () => {
      render(<InterviewOrchestrator />);
      
      expect(screen.getByText('Ghost Interviewer')).toBeInTheDocument();
      expect(screen.getByText('Practice interviews. Reflect deeply. Get better.')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /start your interview/i })).toBeInTheDocument();
    });

    it('displays feature highlights on hero page', () => {
      render(<InterviewOrchestrator />);
      
      expect(screen.getByText('Practice Anywhere')).toBeInTheDocument();
      expect(screen.getByText('Instant Feedback')).toBeInTheDocument();
      expect(screen.getByText('Learn & Improve')).toBeInTheDocument();
    });
  });

  describe('Interview Flow', () => {
    it('starts interview when start button is clicked', async () => {
      const user = userEvent.setup();
      render(<InterviewOrchestrator />);
      
      const startButton = screen.getByRole('button', { name: /start your interview/i });
      await user.click(startButton);
      
      // Should show the first question
      expect(screen.getByText(/Question 1 of/)).toBeInTheDocument();
      expect(screen.getByText(/% Complete/)).toBeInTheDocument();
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('displays progress indicator correctly', async () => {
      const user = userEvent.setup();
      render(<InterviewOrchestrator />);
      
      await user.click(screen.getByRole('button', { name: /start your interview/i }));
      
      expect(screen.getByText('Question 1 of 5')).toBeInTheDocument();
      expect(screen.getByText('20% Complete')).toBeInTheDocument();
    });

    it('allows user to type response', async () => {
      const user = userEvent.setup();
      render(<InterviewOrchestrator />);
      
      await user.click(screen.getByRole('button', { name: /start your interview/i }));
      
      const textarea = screen.getByRole('textbox');
      await user.type(textarea, 'This is my response');
      
      expect(textarea).toHaveValue('This is my response');
    });

    it('submits answer and shows feedback', async () => {
      const user = userEvent.setup();
      render(<InterviewOrchestrator />);
      
      await user.click(screen.getByRole('button', { name: /start your interview/i }));
      
      const textarea = screen.getByRole('textbox');
      await user.type(textarea, 'My detailed response');
      
      const submitButton = screen.getByRole('button', { name: /submit answer/i });
      await user.click(submitButton);
      
      await waitFor(() => {
        expect(screen.getByText('AI Feedback:')).toBeInTheDocument();
      });
    });

    it('shows feedback icons for different types', async () => {
      const user = userEvent.setup();
      const { container } = render(<InterviewOrchestrator />);
      
      await user.click(screen.getByRole('button', { name: /start your interview/i }));
      
      const textarea = screen.getByRole('textbox');
      await user.type(textarea, 'My answer');
      
      await user.click(screen.getByRole('button', { name: /submit answer/i }));
      
      await waitFor(() => {
        expect(container.querySelector('svg.text-green-500')).toBeInTheDocument();
        expect(container.querySelector('svg.text-yellow-500')).toBeInTheDocument();
        expect(container.querySelector('svg.text-blue-500')).toBeInTheDocument();
      });
    });

    it('prevents submission with empty response', async () => {
      const user = userEvent.setup();
      
      // Mock alert
      window.alert = jest.fn();
      
      render(<InterviewOrchestrator />);
      
      await user.click(screen.getByRole('button', { name: /start your interview/i }));
      
      const submitButton = screen.getByRole('button', { name: /submit answer/i });
      await user.click(submitButton);
      
      expect(window.alert).toHaveBeenCalledWith('Please provide an answer before proceeding.');
    });

    it('shows next question button after feedback', async () => {
      const user = userEvent.setup();
      render(<InterviewOrchestrator />);
      
      await user.click(screen.getByRole('button', { name: /start your interview/i }));
      
      const textarea = screen.getByRole('textbox');
      await user.type(textarea, 'My response');
      
      await user.click(screen.getByRole('button', { name: /submit answer/i }));
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /next question/i })).toBeInTheDocument();
      });
    });

    it('shows finish interview button on last question', async () => {
      const user = userEvent.setup();
      render(<InterviewOrchestrator />);
      
      await user.click(screen.getByRole('button', { name: /start your interview/i }));
      
      // Navigate to last question (simulate)
      for (let i = 0; i < 4; i++) {
        const textarea = screen.getByRole('textbox');
        await user.clear(textarea);
        await user.type(textarea, `Response ${i + 1}`);
        
        await user.click(screen.getByRole('button', { name: /submit answer/i }));
        
        await waitFor(() => {
          expect(screen.getByRole('button', { name: /next question/i })).toBeInTheDocument();
        });
        
        await user.click(screen.getByRole('button', { name: /next question/i }));
      }
      
      // Now on last question
      const textarea = screen.getByRole('textbox');
      await user.type(textarea, 'Final response');
      
      await user.click(screen.getByRole('button', { name: /submit answer/i }));
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /finish interview/i })).toBeInTheDocument();
      });
    });
  });

  describe('Speech Recognition', () => {
    it('toggles recording state when microphone button is clicked', async () => {
      const user = userEvent.setup();
      render(<InterviewOrchestrator />);
      
      await user.click(screen.getByRole('button', { name: /start your interview/i }));
      
      const micButton = screen.getByRole('button', { name: /start recording/i });
      await user.click(micButton);
      
      expect(screen.getByRole('button', { name: /stop recording/i })).toBeInTheDocument();
    });
  });

  describe('Text-to-Speech', () => {
    it('shows audio control button when TTS is available', async () => {
      const user = userEvent.setup();
      render(<InterviewOrchestrator />);
      
      await user.click(screen.getByRole('button', { name: /start your interview/i }));
      
      expect(screen.getByRole('button', { name: /play question audio/i })).toBeInTheDocument();
    });
  });

  describe('Interview Summary', () => {
    it('shows analysis when interview is completed', async () => {
      const user = userEvent.setup();
      render(<InterviewOrchestrator />);
      
      await user.click(screen.getByRole('button', { name: /start your interview/i }));
      
      // Complete all questions quickly
      for (let i = 0; i < 5; i++) {
        const textarea = screen.getByRole('textbox');
        await user.clear(textarea);
        await user.type(textarea, `Response ${i + 1}`);
        
        await user.click(screen.getByRole('button', { name: /submit answer/i }));
        
        await waitFor(() => {
          const isLastQuestion = i === 4;
          const buttonName = isLastQuestion ? /finish interview/i : /next question/i;
          expect(screen.getByRole('button', { name: buttonName })).toBeInTheDocument();
        });
        
        const isLastQuestion = i === 4;
        const buttonName = isLastQuestion ? /finish interview/i : /next question/i;
        await user.click(screen.getByRole('button', { name: buttonName }));
      }
      
      await waitFor(() => {
        expect(screen.getByText('Interview Complete')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('handles API errors gracefully', async () => {
      // Mock console.error to avoid test output noise
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      const user = userEvent.setup();
      render(<InterviewOrchestrator />);
      
      await user.click(screen.getByRole('button', { name: /start your interview/i }));
      
      const textarea = screen.getByRole('textbox');
      await user.type(textarea, 'My response');
      
      // Mock API error
      const mockFeedbackGenerator = require('@/app/utils/FeedbackGenerator').FeedbackGenerator;
      mockFeedbackGenerator.mockImplementation(() => ({
        generateFeedback: jest.fn().mockRejectedValue(new Error('API Error'))
      }));
      
      await user.click(screen.getByRole('button', { name: /submit answer/i }));
      
      await waitFor(() => {
        expect(screen.getByText(/Unable to generate feedback/)).toBeInTheDocument();
      });
      
      consoleSpy.mockRestore();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels and roles', async () => {
      const user = userEvent.setup();
      render(<InterviewOrchestrator />);
      
      await user.click(screen.getByRole('button', { name: /start your interview/i }));
      
      expect(screen.getByRole('textbox')).toHaveAttribute('aria-label', 'Your interview response');
      expect(screen.getByRole('button', { name: /play question audio/i })).toHaveAttribute('title', 'Play question audio');
      expect(screen.getByRole('button', { name: /start recording/i })).toHaveAttribute('title', 'Start recording');
    });
  });
});
