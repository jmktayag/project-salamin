export type InterviewType = 'behavioral' | 'technical' | 'mixed';

export interface InterviewConfiguration {
  position: string;
  interviewType: InterviewType;
}

export interface InterviewTypeOption {
  value: InterviewType;
  label: string;
  description: string;
}

export const INTERVIEW_TYPE_OPTIONS: InterviewTypeOption[] = [
  {
    value: 'behavioral',
    label: 'Behavioral',
    description: 'Focus on past experiences, situations, and soft skills'
  },
  {
    value: 'technical',
    label: 'Technical',
    description: 'Emphasis on technical knowledge and problem-solving'
  },
  {
    value: 'mixed',
    label: 'Mixed',
    description: 'Combination of behavioral and technical questions'
  }
];