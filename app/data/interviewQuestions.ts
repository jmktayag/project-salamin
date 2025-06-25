import { InterviewType } from '../types/interview';

export interface InterviewQuestion {
  id: string;
  question: string;
  category: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  tips: string[];
}

// Fallback questions for behavioral interviews
const behavioralQuestions: InterviewQuestion[] = [
  {
    id: 'behavioral-1',
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
    id: 'behavioral-2',
    question: 'Tell me about a recent challenge you faced.',
    category: 'Problem Solving',
    difficulty: 'Hard',
    tips: [
      'Choose a specific, relevant example',
      'Focus on your actions and decisions',
      'Highlight what you learned from the experience'
    ]
  },
  {
    id: 'behavioral-3',
    question: 'How do you handle difficult team members?',
    category: 'Teamwork',
    difficulty: 'Medium',
    tips: [
      'Share a specific example if possible',
      'Focus on communication and resolution',
      'Show empathy and professionalism'
    ]
  },
  {
    id: 'behavioral-4',
    question: 'Tell me about a project you led.',
    category: 'Leadership',
    difficulty: 'Medium',
    tips: [
      'Choose a project that shows leadership skills',
      'Explain your role and key decisions',
      'Share the results and impact'
    ]
  },
  {
    id: 'behavioral-5',
    question: 'Describe a time you failed at something.',
    category: 'Growth',
    difficulty: 'Hard',
    tips: [
      'Choose a professional example',
      'Focus on lessons learned and growth',
      'Show resilience and self-awareness'
    ]
  },
  {
    id: 'behavioral-6',
    question: 'How do you handle tight deadlines and pressure?',
    category: 'Stress Management',
    difficulty: 'Medium',
    tips: [
      'Provide specific examples of managing pressure',
      'Discuss your prioritization and time management strategies',
      'Show that you can maintain quality under pressure'
    ]
  },
  {
    id: 'behavioral-7',
    question: 'How do you handle workplace changes?',
    category: 'Adaptability',
    difficulty: 'Medium',
    tips: [
      'Share a specific example of adapting',
      'Show flexibility and positive attitude',
      'Mention helping others when possible'
    ]
  },
  {
    id: 'behavioral-8',
    question: 'What motivates you to do your best work?',
    category: 'Motivation',
    difficulty: 'Easy',
    tips: [
      'Be authentic about what drives you',
      'Connect your motivation to the role and company',
      'Show passion and enthusiasm for your work'
    ]
  }
];

// Fallback questions for technical interviews  
const technicalQuestions: InterviewQuestion[] = [
  {
    id: 'technical-1',
    question: 'What are your core technical skills?',
    category: 'Technical Skills',
    difficulty: 'Easy',
    tips: [
      'Focus on skills most relevant to this role',
      'Mention your experience level with each',
      'Be specific about technologies you know well'
    ]
  },
  {
    id: 'technical-2',
    question: 'Tell me about a technical problem you solved.',
    category: 'Problem Solving',
    difficulty: 'Hard',
    tips: [
      'Choose a recent, relevant example',
      'Explain your approach step by step',
      'Mention the tools and technologies used'
    ]
  },
  {
    id: 'technical-3',
    question: 'How do you debug code issues?',
    category: 'Debugging',
    difficulty: 'Medium',
    tips: [
      'Describe your step-by-step approach',
      'Mention tools and techniques you use',
      'Show systematic thinking'
    ]
  },
  {
    id: 'technical-4',
    question: 'How do you choose technologies for projects?',
    category: 'Architecture',
    difficulty: 'Medium',
    tips: [
      'Consider project requirements and constraints',
      'Think about team skills and maintainability',
      'Balance innovation with practicality'
    ]
  },
  {
    id: 'technical-5',
    question: 'How do you ensure code quality and maintainability?',
    category: 'Best Practices',
    difficulty: 'Medium',
    tips: [
      'Mention code reviews, testing, and documentation',
      'Discuss coding standards and conventions',
      'Show understanding of long-term maintainability'
    ]
  },
  {
    id: 'technical-6',
    question: 'What\'s your experience with testing?',
    category: 'Testing',
    difficulty: 'Medium',
    tips: [
      'Mention types of testing you\'ve done',
      'Share specific frameworks and tools used',
      'Discuss your testing approach'
    ]
  },
  {
    id: 'technical-7',
    question: 'How do you optimize application performance?',
    category: 'Performance',
    difficulty: 'Hard',
    tips: [
      'Share specific optimization techniques',
      'Mention profiling and monitoring tools',
      'Discuss trade-offs you consider'
    ]
  },
  {
    id: 'technical-8',
    question: 'How do you use version control?',
    category: 'Collaboration',
    difficulty: 'Easy',
    tips: [
      'Mention your Git workflow and branching',
      'Discuss code review experience',
      'Show collaborative development understanding'
    ]
  }
];

// Fallback questions for mixed interviews
const mixedQuestions: InterviewQuestion[] = [
  {
    id: 'mixed-1',
    question: 'Tell me about your technical background.',
    category: 'Personal',
    difficulty: 'Easy',
    tips: [
      'Focus on relevant technical experience',
      'Highlight key skills and achievements',
      'Connect your background to this role'
    ]
  },
  {
    id: 'mixed-2',
    question: 'Tell me about a project you\'re proud of.',
    category: 'Technical Achievement',
    difficulty: 'Medium',
    tips: [
      'Choose a project showing relevant skills',
      'Explain the challenges you faced',
      'Share the impact and results'
    ]
  },
  {
    id: 'mixed-3',
    question: 'How do you learn new technologies?',
    category: 'Learning',
    difficulty: 'Medium',
    tips: [
      'Describe your learning approach',
      'Mention how you practice new skills',
      'Show curiosity and growth mindset'
    ]
  },
  {
    id: 'mixed-4',
    question: 'How do you explain technical concepts to non-technical people?',
    category: 'Communication',
    difficulty: 'Hard',
    tips: [
      'Share a specific example',
      'Show how you simplify complex ideas',
      'Demonstrate patience and empathy'
    ]
  },
  {
    id: 'mixed-5',
    question: 'How do you balance quality with deadlines?',
    category: 'Time Management',
    difficulty: 'Medium',
    tips: [
      'Discuss prioritization strategies',
      'Show understanding of business needs',
      'Balance quality focus with practical delivery'
    ]
  },
  {
    id: 'mixed-6',
    question: 'How do you work in development teams?',
    category: 'Teamwork',
    difficulty: 'Medium',
    tips: [
      'Share collaboration experience',
      'Mention tools and processes you use',
      'Show ability to lead and follow'
    ]
  },
  {
    id: 'mixed-7',
    question: 'Tell me about a tough technical decision you made.',
    category: 'Decision Making',
    difficulty: 'Hard',
    tips: [
      'Explain your decision-making process',
      'Discuss the factors you considered',
      'Share the outcome and lessons learned'
    ]
  },
  {
    id: 'mixed-8',
    question: 'How do you stay motivated on difficult projects?',
    category: 'Motivation',  
    difficulty: 'Medium',
    tips: [
      'Share strategies for maintaining momentum',
      'Show resilience and persistence',
      'Connect motivation to impact and growth'
    ]
  }
];

// Default questions (legacy)
const rawInterviewQuestions: InterviewQuestion[] = [
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
    question: 'What are your greatest strengths?',
    category: 'Skills',
    difficulty: 'Medium',
    tips: [
      'Choose strengths relevant to this role',
      'Provide specific examples',
      'Show how these strengths add value'
    ]
  }
];

// Validate question uniqueness and export
function validateInterviewQuestions(questions: InterviewQuestion[]): InterviewQuestion[] {
  const seenIds = new Set<string>();
  const duplicateIds: string[] = [];
  
  questions.forEach(question => {
    if (seenIds.has(question.id)) {
      duplicateIds.push(question.id);
    } else {
      seenIds.add(question.id);
    }
  });
  
  if (duplicateIds.length > 0) {
    console.error('Duplicate question IDs found:', duplicateIds);
    throw new Error(`Duplicate question IDs detected: ${duplicateIds.join(', ')}`);
  }
  
  console.log(`Validated ${questions.length} unique interview questions`);
  return questions;
}

/**
 * Get fallback questions based on interview type
 */
export function getFallbackQuestions(interviewType: InterviewType): InterviewQuestion[] {
  switch (interviewType) {
    case 'behavioral':
      return validateInterviewQuestions(behavioralQuestions);
    case 'technical':
      return validateInterviewQuestions(technicalQuestions);
    case 'mixed':
      return validateInterviewQuestions(mixedQuestions);
    default:
      return validateInterviewQuestions(rawInterviewQuestions);
  }
}

export const interviewQuestions = validateInterviewQuestions(rawInterviewQuestions);