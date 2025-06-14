import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import InterviewCard from '@/app/components/InterviewCard';

describe('getFeedbackIcon', () => {
  it('returns correct icons for success, warning and info types', async () => {
    const user = userEvent.setup();
    const { container } = render(<InterviewCard />);

    // Start interview
    await user.click(screen.getByRole('button', { name: /start your interview/i }));

    // Provide answer
    const textarea = screen.getByRole('textbox');
    await user.type(textarea, 'My answer');

    // Submit answer to reveal feedback section
    await user.click(screen.getByRole('button', { name: /submit answer/i }));

    expect(container.querySelector('svg.text-green-500')).toBeInTheDocument();
    expect(container.querySelector('svg.text-yellow-500')).toBeInTheDocument();
    expect(container.querySelector('svg.text-blue-500')).toBeInTheDocument();
  });
});
