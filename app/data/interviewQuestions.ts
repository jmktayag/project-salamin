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
    question: 'Describe a challenging situation you faced at work and how you handled it.',
    category: 'Problem Solving',
    difficulty: 'Hard',
    tips: [
      'Use the STAR method (Situation, Task, Action, Result)',
      'Focus on your actions and decisions',
      'Highlight what you learned from the experience'
    ]
  },
  {
    id: 'behavioral-3',
    question: 'Tell me about a time when you had to work with a difficult team member.',
    category: 'Teamwork',
    difficulty: 'Medium',
    tips: [
      'Show your communication and conflict resolution skills',
      'Focus on the positive outcome',
      'Demonstrate empathy and professionalism'
    ]
  },
  {
    id: 'behavioral-4',
    question: 'Describe a project you led and what made it successful.',
    category: 'Leadership',
    difficulty: 'Medium',
    tips: [
      'Highlight your leadership and planning skills',
      'Discuss how you motivated and guided your team',
      'Quantify the results if possible'
    ]
  },
  {
    id: 'behavioral-5',
    question: 'Tell me about a time when you failed and what you learned from it.',
    category: 'Growth',
    difficulty: 'Hard',
    tips: [
      'Be honest but choose a professional example',
      'Focus on what you learned and how you improved',
      'Show resilience and growth mindset'
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
    question: 'Describe a time when you had to adapt to a significant change at work.',
    category: 'Adaptability',
    difficulty: 'Medium',
    tips: [
      'Show your flexibility and openness to change',
      'Discuss how you helped others adapt too',
      'Highlight the positive outcomes of the change'
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
    question: 'What are your core technical skills and how do you stay current?',
    category: 'Technical Skills',
    difficulty: 'Easy',
    tips: [
      'List your most relevant technical skills for this role',
      'Mention specific learning resources you use',
      'Show commitment to continuous learning'
    ]
  },
  {
    id: 'technical-2',
    question: 'Describe a complex technical problem you solved recently.',
    category: 'Problem Solving',
    difficulty: 'Hard',
    tips: [
      'Break down the problem and your solution approach',
      'Explain your thought process and decision-making',
      'Discuss the tools and technologies you used'
    ]
  },
  {
    id: 'technical-3',
    question: 'How do you approach debugging when something isn\'t working?',
    category: 'Debugging',
    difficulty: 'Medium',
    tips: [
      'Describe your systematic debugging methodology',
      'Mention specific tools and techniques you use',
      'Show patience and analytical thinking'
    ]
  },
  {
    id: 'technical-4',
    question: 'What factors do you consider when choosing technologies for a project?',
    category: 'Architecture',
    difficulty: 'Medium',
    tips: [
      'Discuss scalability, maintainability, and team expertise',
      'Consider project requirements and constraints',
      'Show balance between innovation and practicality'
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
    question: 'Describe your experience with testing and quality assurance.',
    category: 'Testing',
    difficulty: 'Medium',
    tips: [
      'Discuss different types of testing you\'ve done',
      'Mention specific testing frameworks and tools',
      'Show understanding of test-driven development'
    ]
  },
  {
    id: 'technical-7',
    question: 'How do you handle performance optimization in your applications?',
    category: 'Performance',
    difficulty: 'Hard',
    tips: [
      'Discuss profiling and monitoring techniques',
      'Mention specific optimization strategies you\'ve used',
      'Show understanding of performance trade-offs'
    ]
  },
  {
    id: 'technical-8',
    question: 'What\'s your experience with version control and collaboration?',
    category: 'Collaboration',
    difficulty: 'Easy',
    tips: [
      'Discuss your Git workflow and branching strategies',
      'Mention code review processes you\'ve participated in',
      'Show understanding of collaborative development'
    ]
  }
];

// Fallback questions for mixed interviews
const mixedQuestions: InterviewQuestion[] = [
  {
    id: 'mixed-1',
    question: 'Tell me about yourself and your technical background.',
    category: 'Personal',
    difficulty: 'Easy',
    tips: [
      'Balance personal story with technical expertise',
      'Highlight relevant experience and skills',
      'Connect your background to the role'
    ]
  },
  {
    id: 'mixed-2',
    question: 'Describe a technical project you\'re proud of and the challenges you overcame.',
    category: 'Technical Achievement',
    difficulty: 'Medium',
    tips: [
      'Choose a project that showcases relevant skills',
      'Discuss both technical and soft skill challenges',
      'Quantify the impact and results'
    ]
  },
  {
    id: 'mixed-3',
    question: 'How do you approach learning new technologies or frameworks?',
    category: 'Learning',
    difficulty: 'Medium',
    tips: [
      'Describe your systematic approach to learning',
      'Mention how you practice and apply new knowledge',
      'Show adaptability and growth mindset'
    ]
  },
  {
    id: 'mixed-4',
    question: 'Tell me about a time when you had to explain a complex technical concept to a non-technical person.',
    category: 'Communication',
    difficulty: 'Hard',
    tips: [
      'Show your ability to simplify complex ideas',
      'Demonstrate patience and empathy',
      'Focus on successful communication outcomes'
    ]
  },
  {
    id: 'mixed-5',
    question: 'How do you balance technical excellence with meeting deadlines?',
    category: 'Time Management',
    difficulty: 'Medium',
    tips: [
      'Discuss prioritization and trade-off decisions',
      'Show understanding of business needs',
      'Demonstrate both quality focus and practical thinking'
    ]
  },
  {
    id: 'mixed-6',
    question: 'Describe your experience working in a team development environment.',
    category: 'Teamwork',
    difficulty: 'Medium',
    tips: [
      'Discuss collaboration tools and processes',
      'Highlight your role in team success',
      'Show ability to both lead and follow'
    ]
  },
  {
    id: 'mixed-7',
    question: 'What\'s the most challenging technical decision you\'ve had to make recently?',
    category: 'Decision Making',
    difficulty: 'Hard',
    tips: [
      'Explain your decision-making process',
      'Discuss the factors you considered',
      'Reflect on the outcome and lessons learned'
    ]
  },
  {
    id: 'mixed-8',
    question: 'How do you stay motivated when working on long-term or difficult projects?',
    category: 'Motivation',  
    difficulty: 'Medium',
    tips: [
      'Discuss your strategies for maintaining momentum',
      'Show resilience and persistence',
      'Connect your motivation to impact and growth'
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
    question: 'What are your greatest strengths and how do they align with this position?',
    category: 'Skills',
    difficulty: 'Medium',
    tips: [
      'Choose strengths relevant to the job',
      'Provide specific examples',
      'Explain how these strengths benefit the company'
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