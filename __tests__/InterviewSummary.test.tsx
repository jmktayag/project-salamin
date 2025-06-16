import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InterviewSummary } from '@/app/components/InterviewSummary';
import type { InterviewAnalysis } from '@/app/utils/InterviewAnalyzer';

const mockAnalysis: InterviewAnalysis = {
  strengths: [
    'Clear communication skills',
    'Good technical knowledge',
    'Strong problem-solving approach'
  ],
  weaknesses: [
    'Could provide more specific examples',
    'Some answers were too brief'
  ],
  suggestions: [
    'Use the STAR method for behavioral questions',
    'Prepare more detailed examples'
  ],
  score: 85,
  verdict: 'Hire',
  summary: 'Strong candidate with good technical skills and clear communication. Some areas for improvement in providing detailed examples.'
};

const mockProps = {
  ...mockAnalysis,
  onNewInterview: jest.fn(),
  onReviewFeedback: jest.fn()
};

describe('InterviewSummary', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders interview summary with correct data', () => {
    render(<InterviewSummary {...mockProps} />);
    
    expect(screen.getByText('Interview Complete')).toBeInTheDocument();
    expect(screen.getByText('85/100')).toBeInTheDocument();
    expect(screen.getByText('Hire')).toBeInTheDocument();
    expect(screen.getByText(mockAnalysis.summary)).toBeInTheDocument();
  });

  it('displays all strengths correctly', () => {
    render(<InterviewSummary {...mockProps} />);
    
    mockAnalysis.strengths.forEach(strength => {
      expect(screen.getByText(strength)).toBeInTheDocument();
    });
  });

  it('displays all weaknesses correctly', () => {
    render(<InterviewSummary {...mockProps} />);
    
    mockAnalysis.weaknesses.forEach(weakness => {
      expect(screen.getByText(weakness)).toBeInTheDocument();
    });
  });

  it('displays all suggestions correctly', () => {
    render(<InterviewSummary {...mockProps} />);
    
    mockAnalysis.suggestions.forEach(suggestion => {
      expect(screen.getByText(suggestion)).toBeInTheDocument();
    });
  });

  it('calls onNewInterview when Start New Interview button is clicked', async () => {
    const user = userEvent.setup();
    render(<InterviewSummary {...mockProps} />);
    
    const newInterviewButton = screen.getByText('Start New Interview');
    await user.click(newInterviewButton);
    
    expect(mockProps.onNewInterview).toHaveBeenCalledTimes(1);
  });

  it('calls onReviewFeedback when Review All Feedback button is clicked', async () => {
    const user = userEvent.setup();
    render(<InterviewSummary {...mockProps} />);
    
    const reviewFeedbackButton = screen.getByText('Review All Feedback');
    await user.click(reviewFeedbackButton);
    
    expect(mockProps.onReviewFeedback).toHaveBeenCalledTimes(1);
  });

  it('applies correct verdict color classes', () => {
    const { rerender } = render(<InterviewSummary {...mockProps} />);
    
    // Test Hire verdict
    expect(screen.getByText('Hire').closest('div')).toHaveClass('text-blue-600', 'bg-blue-50');
    
    // Test Strong Hire verdict
    rerender(<InterviewSummary {...mockProps} verdict="Strong Hire" />);
    expect(screen.getByText('Strong Hire').closest('div')).toHaveClass('text-green-600', 'bg-green-50');
    
    // Test Weak Hire verdict
    rerender(<InterviewSummary {...mockProps} verdict="Weak Hire" />);
    expect(screen.getByText('Weak Hire').closest('div')).toHaveClass('text-yellow-600', 'bg-yellow-50');
    
    // Test No Hire verdict
    rerender(<InterviewSummary {...mockProps} verdict="No Hire" />);
    expect(screen.getByText('No Hire').closest('div')).toHaveClass('text-red-600', 'bg-red-50');
  });

  it('handles empty arrays gracefully', () => {
    const emptyProps = {
      ...mockProps,
      strengths: [],
      weaknesses: [],
      suggestions: []
    };
    
    render(<InterviewSummary {...emptyProps} />);
    
    expect(screen.getByText('No notable strengths were identified.')).toBeInTheDocument();
    expect(screen.getByText('No specific areas for improvement were identified.')).toBeInTheDocument();
    expect(screen.getByText('No specific suggestions were provided.')).toBeInTheDocument();
  });

  it('has proper accessibility attributes', () => {
    render(<InterviewSummary {...mockProps} />);
    
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(2);
    
    buttons.forEach(button => {
      expect(button).toBeVisible();
      expect(button).toBeEnabled();
    });
  });
});