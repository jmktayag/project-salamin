/**
 * Comprehensive list of job positions for autocomplete functionality
 * Organized by categories for better maintainability
 */

export const JOB_POSITIONS = [
  // Software Engineering & Development
  'Software Engineer',
  'Senior Software Engineer',
  'Lead Software Engineer',
  'Staff Software Engineer',
  'Principal Software Engineer',
  'Frontend Developer',
  'Senior Frontend Developer',
  'Backend Developer',
  'Senior Backend Developer',
  'Full Stack Developer',
  'Senior Full Stack Developer',
  'Web Developer',
  'Mobile Developer',
  'iOS Developer',
  'Android Developer',
  'React Developer',
  'Angular Developer',
  'Vue.js Developer',
  'Node.js Developer',
  'Python Developer',
  'Java Developer',
  'C# Developer',
  '.NET Developer',
  'PHP Developer',
  'Ruby Developer',
  'Go Developer',
  'Rust Developer',
  'Swift Developer',
  'Kotlin Developer',

  // DevOps & Infrastructure
  'DevOps Engineer',
  'Senior DevOps Engineer',
  'Site Reliability Engineer',
  'Cloud Engineer',
  'AWS Engineer',
  'Azure Engineer',
  'Google Cloud Engineer',
  'Platform Engineer',
  'Infrastructure Engineer',
  'Systems Administrator',
  'Network Engineer',
  'Security Engineer',
  'Cybersecurity Analyst',

  // Data & Analytics
  'Data Scientist',
  'Senior Data Scientist',
  'Data Analyst',
  'Senior Data Analyst',
  'Data Engineer',
  'Machine Learning Engineer',
  'AI Engineer',
  'Business Intelligence Analyst',
  'Research Scientist',
  'Quantitative Analyst',
  'Database Administrator',
  'Big Data Engineer',

  // Product & Management
  'Product Manager',
  'Senior Product Manager',
  'Principal Product Manager',
  'Product Owner',
  'Project Manager',
  'Program Manager',
  'Engineering Manager',
  'Technical Lead',
  'Team Lead',
  'Scrum Master',
  'Agile Coach',

  // Design & UX
  'UX Designer',
  'Senior UX Designer',
  'UI Designer',
  'Product Designer',
  'Visual Designer',
  'Interaction Designer',
  'User Researcher',
  'Design Director',
  'Creative Director',
  'Graphic Designer',

  // Quality Assurance
  'QA Engineer',
  'Test Engineer',
  'Automation Engineer',
  'QA Analyst',
  'Software Tester',
  'Performance Engineer',

  // Sales & Marketing
  'Sales Representative',
  'Account Executive',
  'Sales Manager',
  'Business Development Representative',
  'Marketing Manager',
  'Digital Marketing Manager',
  'Content Marketing Manager',
  'SEO Specialist',
  'Social Media Manager',
  'Marketing Analyst',
  'Growth Manager',
  'Customer Success Manager',

  // Business & Operations
  'Business Analyst',
  'Operations Manager',
  'Operations Analyst',
  'Financial Analyst',
  'Consultant',
  'Strategy Consultant',
  'Business Intelligence Developer',
  'Process Improvement Analyst',

  // Human Resources
  'HR Manager',
  'Recruiter',
  'Technical Recruiter',
  'Talent Acquisition Specialist',
  'HR Business Partner',
  'People Operations Manager',

  // Finance & Accounting
  'Financial Analyst',
  'Accountant',
  'Controller',
  'CFO',
  'Investment Analyst',
  'Risk Analyst',

  // Customer Support
  'Customer Support Representative',
  'Technical Support Engineer',
  'Customer Success Representative',
  'Support Manager',

  // Executive & Leadership
  'CEO',
  'CTO',
  'VP Engineering',
  'VP Product',
  'VP Sales',
  'VP Marketing',
  'Director of Engineering',
  'Director of Product',

  // Specialized Roles
  'Solutions Architect',
  'Technical Architect',
  'Systems Analyst',
  'Business Systems Analyst',
  'Technical Writer',
  'Documentation Manager',
  'Release Manager',
  'Build Engineer',
].sort(); // Sort alphabetically for better UX

export type JobPosition = typeof JOB_POSITIONS[number];

/**
 * Filter job positions based on search query
 * @param query - Search string
 * @param maxResults - Maximum number of results to return
 * @returns Filtered array of job positions
 */
export function filterJobPositions(query: string, maxResults: number = 8): string[] {
  if (!query.trim()) {
    return [];
  }

  const normalizedQuery = query.toLowerCase().trim();
  
  // First, find exact matches at the beginning
  const startsWithMatches = JOB_POSITIONS.filter(position => 
    position.toLowerCase().startsWith(normalizedQuery)
  );

  // Then, find matches that contain the query
  const containsMatches = JOB_POSITIONS.filter(position => 
    position.toLowerCase().includes(normalizedQuery) && 
    !position.toLowerCase().startsWith(normalizedQuery)
  );

  // Combine and limit results
  return [...startsWithMatches, ...containsMatches].slice(0, maxResults);
}