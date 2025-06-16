import { BaseAIService } from './BaseAIService';

export interface InterviewAnalysis {
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  score: number;
  verdict: 'Strong Hire' | 'Hire' | 'Weak Hire' | 'No Hire';
  summary: string;
}

export class InterviewAnalyzer extends BaseAIService {
  constructor(apiKey?: string) {
    super('InterviewAnalyzer', apiKey);
  }

  async analyzeInterview(feedback: Array<{ question: string; feedback: string }>): Promise<InterviewAnalysis> {
    // Input validation
    if (!feedback || feedback.length === 0) {
      throw new Error('Interview data is required for analysis');
    }

    // Validate feedback format
    feedback.forEach((item, index) => {
      if (!item.question?.trim() || !item.feedback?.trim()) {
        throw new Error(`Invalid feedback item at index ${index}: question and feedback are required`);
      }
    });

    const model = 'gemini-2.0-flash-lite';
    const prompt = `
      Analyze the following interview feedback and provide a comprehensive assessment.
      Focus on identifying key strengths, areas for improvement, and specific suggestions.
      Calculate a final score out of 100 based on:
      - Relevance and clarity of answers (50 points)
      - Fit for the role (30 points)
      - Enthusiasm and growth potential (20 points)
      
      Provide a verdict based on the score:
      - 90-100: Strong Hire
      - 75-89: Hire
      - 60-74: Weak Hire
      - Below 60: No Hire

      Interview Feedback:
      ${feedback.map(f => `Q: ${f.question}\nA: ${f.feedback}`).join('\n\n')}

      Please provide your analysis in the following JSON format:
      {
        "strengths": string[],
        "weaknesses": string[],
        "suggestions": string[],
        "score": number,
        "verdict": "Strong Hire" | "Hire" | "Weak Hire" | "No Hire",
        "summary": string
      }
    `;

    return await this.withRetry(async () => {
      const responseText = await this.generateContent({
        model,
        prompt,
        config: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95
        }
      });

      const analysis = this.parseJSONOptimized<InterviewAnalysis>(responseText);
      this.validateAnalysis(analysis);
      return analysis;
    });
  }

  private validateAnalysis(analysis: InterviewAnalysis): void {
    const requiredFields = ['strengths', 'weaknesses', 'suggestions', 'score', 'verdict', 'summary'];
    this.validateResponseStructure(analysis, requiredFields);
    
    // Additional specific validations
    if (!Array.isArray(analysis.strengths)) {
      throw new Error('Strengths must be an array');
    }
    if (!Array.isArray(analysis.weaknesses)) {
      throw new Error('Weaknesses must be an array');
    }
    if (!Array.isArray(analysis.suggestions)) {
      throw new Error('Suggestions must be an array');
    }
    if (typeof analysis.score !== 'number' || analysis.score < 0 || analysis.score > 100) {
      throw new Error('Score must be a number between 0 and 100');
    }
    const validVerdicts = ['Strong Hire', 'Hire', 'Weak Hire', 'No Hire'];
    if (!validVerdicts.includes(analysis.verdict)) {
      throw new Error(`Invalid verdict: ${analysis.verdict}`);
    }
    if (typeof analysis.summary !== 'string' || analysis.summary.trim().length === 0) {
      throw new Error('Summary must be a non-empty string');
    }
  }

  // Static utility methods for backward compatibility
  static getScoreThresholds() {
    return {
      STRONG_HIRE: 90,
      HIRE: 75,
      WEAK_HIRE: 60
    };
  }

  static getScoreWeights() {
    return {
      relevanceAndClarity: 50,
      rolefit: 30,
      enthusiasmAndGrowth: 20
    };
  }

  static calculateVerdictFromScore(score: number): 'Strong Hire' | 'Hire' | 'Weak Hire' | 'No Hire' {
    const thresholds = InterviewAnalyzer.getScoreThresholds();
    if (score >= thresholds.STRONG_HIRE) return 'Strong Hire';
    if (score >= thresholds.HIRE) return 'Hire';
    if (score >= thresholds.WEAK_HIRE) return 'Weak Hire';
    return 'No Hire';
  }

  static createComprehensiveInterviewData(
    questions: Array<{ id: string; question: string; category: string; difficulty: 'Easy' | 'Medium' | 'Hard'; tips: string[] }>,
    responses: string[],
    feedbackArrays: Array<{ type: 'success' | 'warning' | 'suggestion'; text: string }[]>
  ) {
    if (questions.length !== responses.length || questions.length !== feedbackArrays.length) {
      throw new Error('Questions, responses, and feedback arrays must have the same length');
    }

    return questions.map((question, index) => ({
      id: question.id,
      question: question.question,
      category: question.category,
      difficulty: question.difficulty,
      tips: question.tips,
      userResponse: responses[index],
      aiFeedback: feedbackArrays[index] || []
    }));
  }

  // Method for comprehensive data analysis (extended functionality)
  async analyzeInterviewComprehensive(data: Array<{
    id: string;
    question: string;
    category: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    tips: string[];
    userResponse: string;
    aiFeedback: Array<{ type: 'success' | 'warning' | 'suggestion'; text: string }>;
  }>): Promise<InterviewAnalysis> {
    // Validate comprehensive input data
    if (!data || data.length === 0) {
      throw new Error('Comprehensive interview data is required for analysis');
    }

    data.forEach((item, index) => {
      if (!item.id?.trim() || !item.question?.trim() || !item.userResponse?.trim()) {
        throw new Error(`Invalid interview data at index ${index}: id, question, and userResponse are required`);
      }
      
      if (!item.category?.trim() || !['Easy', 'Medium', 'Hard'].includes(item.difficulty)) {
        throw new Error(`Invalid interview data at index ${index}: valid category and difficulty are required`);
      }
      
      if (!Array.isArray(item.aiFeedback)) {
        throw new Error(`Invalid interview data at index ${index}: aiFeedback must be an array`);
      }
    });

    // Convert comprehensive data to simple feedback format for analysis
    const feedback = data.map(item => ({
      question: item.question,
      feedback: item.userResponse
    }));

    return this.analyzeInterview(feedback);
  }
} 