export type NavigationPage = 'home' | 'interview' | 'summary' | 'history';

export type InterviewStep = 'configuration' | 'interview' | 'summary';

export interface NavigationState {
  currentPage: NavigationPage;
  interviewStep?: InterviewStep;
  interviewStarted: boolean;
}

export interface NavigationContextType extends NavigationState {
  setCurrentPage: (page: NavigationPage) => void;
  setInterviewStep: (step: InterviewStep) => void;
  setInterviewStarted: (started: boolean) => void;
  resetNavigation: () => void;
  resetToHome: () => void;
  registerResetToHome: (callback: () => void) => void;
}

export interface BreadcrumbItem {
  label: string;
  step: InterviewStep;
  isActive: boolean;
  isCompleted: boolean;
  isClickable: boolean;
}

