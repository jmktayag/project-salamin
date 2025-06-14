export interface InterviewQuestion {
  id: string;
  question: string;
  category: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  tips: string[];
}

export const interviewQuestions: InterviewQuestion[] = [
  {
    id: '1',
    question: 'Tell me about yourself and your background.',
    category: 'Personal',
    difficulty: 'Easy',
    tips: [
      'Keep it professional and relevant to the role',
      'Focus on your most recent and relevant experience',
      'Include your key achievements and skills'
    ]
  },
  {
    id: '2',
    question: 'What are your greatest strengths and how do they align with this position?',
    category: 'Skills',
    difficulty: 'Medium',
    tips: [
      'Choose strengths relevant to the job',
      'Provide specific examples',
      'Explain how these strengths benefit the company'
    ]
  },
  {
    id: '3',
    question: 'Describe a challenging situation you faced at work and how you handled it.',
    category: 'Behavioral',
    difficulty: 'Hard',
    tips: [
      'Use the STAR method (Situation, Task, Action, Result)',
      'Focus on your actions and decisions',
      'Highlight what you learned from the experience'
    ]
  },
  {
    id: '4',
    question: 'Where do you see yourself in five years?',
    category: 'Career Goals',
    difficulty: 'Medium',
    tips: [
      'Show ambition but stay realistic',
      'Align your goals with the company',
      'Demonstrate commitment to growth'
    ]
  },
  {
    id: '5',
    question: 'Why do you want to work for this company?',
    category: 'Motivation',
    difficulty: 'Medium',
    tips: [
      'Research the company thoroughly',
      'Connect your values with company values',
      'Show enthusiasm for the role and company'
    ]
  }
]; 