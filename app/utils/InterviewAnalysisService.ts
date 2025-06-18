import { BaseAIService } from './BaseAIService';

export interface InterviewAnalysis {
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  score: number;
  verdict: 'Strong Hire' | 'Hire' | 'Weak Hire' | 'No Hire';
  summary: string;
}

export class InterviewAnalysisService extends BaseAIService {
  constructor(apiKey?: string) {
    super('InterviewAnalysisService', apiKey);
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
    const prompt = `You are an expert interview evaluator for the Salamin AI interview practice platform. Your role is to provide fair, constructive, and actionable analysis of practice interview sessions to help job seekers improve their performance.

EVALUATION PRINCIPLES:
- Be strict and fair in giving feedback and scoring
- Only highlight genuine strengths that demonstrate real competency
- Identify specific areas where performance falls short of industry standards
- Provide actionable, evidence-based suggestions for improvement
- Maintain professional standards while being constructive

SCORING CRITERIA (Total: 100 points):

1. TECHNICAL COMPETENCY & RELEVANCE (40 points):
   - Demonstrates actual knowledge and skills relevant to the role
   - Provides specific examples and concrete evidence
   - Shows understanding of industry practices and standards
   - Answers directly address the question asked

2. COMMUNICATION & STRUCTURE (30 points):
   - Clear, well-organized responses with logical flow
   - Professional communication style appropriate for interviews
   - Effective use of examples and storytelling techniques
   - Demonstrates active listening and comprehension

3. PROBLEM-SOLVING & CRITICAL THINKING (20 points):
   - Shows analytical approach to challenges
   - Demonstrates ability to break down complex problems
   - Provides thoughtful consideration of trade-offs and alternatives
   - Shows learning from past experiences

4. PREPARATION & CULTURAL FIT (10 points):
   - Evidence of research about the role/company
   - Shows genuine interest and motivation
   - Aligns with professional expectations and values
   - Demonstrates career growth mindset

STRICT SCORING THRESHOLDS:
- 90-100: Strong Hire (Exceptional performance, ready for the role)
- 75-89: Hire (Good performance with minor areas for improvement)
- 60-74: Weak Hire (Shows potential but significant gaps need addressing)
- Below 60: No Hire (Major deficiencies that require substantial development)

IMPORTANT: Be rigorous in your assessment. A score of 75+ should indicate genuine readiness for professional interviews. Do not inflate scores. Focus on evidence-based evaluation rather than potential.

Interview Q&A Data:
${feedback.map(f => `Question: ${f.question}\nResponse: ${f.feedback}`).join('\n\n')}

Provide your strict, fair evaluation in the following JSON format:
{
  "strengths": ["List only genuine, evidence-based strengths demonstrated in responses"],
  "weaknesses": ["Identify specific areas where performance falls short of professional standards"],
  "suggestions": ["Provide concrete, actionable improvement recommendations with specific steps"],
  "score": number,
  "verdict": "Strong Hire" | "Hire" | "Weak Hire" | "No Hire",
  "summary": "A comprehensive assessment that honestly evaluates performance against industry standards"
}`;

    try {
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
    } catch (error) {
      // Return fallback analysis instead of throwing
      return this.getFallbackAnalysis();
    }
  }

  private validateAnalysis(analysis: InterviewAnalysis): void {
    const requiredFields = ['strengths', 'weaknesses', 'suggestions', 'score', 'verdict', 'summary'];
    this.validateResponseStructure(analysis as unknown as Record<string, unknown>, requiredFields);
    
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

  private getFallbackAnalysis(): InterviewAnalysis {
    return {
      strengths: [],
      weaknesses: ['Unable to properly evaluate responses due to technical issues'],
      suggestions: ['Please try the interview again to get proper feedback'],
      score: 50,
      verdict: 'Weak Hire',
      summary: 'Analysis could not be completed due to technical issues. Please retry the interview for accurate feedback.'
    };
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
      technicalCompetencyRelevance: 40,
      communicationStructure: 30,
      problemSolvingCriticalThinking: 20,
      preparationCulturalFit: 10
    };
  }

  // New method to get detailed scoring rubric
  static getScoringRubric() {
    return {
      technicalCompetencyRelevance: {
        weight: 40,
        criteria: [
          'Demonstrates actual knowledge and skills relevant to the role',
          'Provides specific examples and concrete evidence',
          'Shows understanding of industry practices and standards',
          'Answers directly address the question asked'
        ]
      },
      communicationStructure: {
        weight: 30,
        criteria: [
          'Clear, well-organized responses with logical flow',
          'Professional communication style appropriate for interviews',
          'Effective use of examples and storytelling techniques',
          'Demonstrates active listening and comprehension'
        ]
      },
      problemSolvingCriticalThinking: {
        weight: 20,
        criteria: [
          'Shows analytical approach to challenges',
          'Demonstrates ability to break down complex problems',
          'Provides thoughtful consideration of trade-offs and alternatives',
          'Shows learning from past experiences'
        ]
      },
      preparationCulturalFit: {
        weight: 10,
        criteria: [
          'Evidence of research about the role/company',
          'Shows genuine interest and motivation',
          'Aligns with professional expectations and values',
          'Demonstrates career growth mindset'
        ]
      }
    };
  }

  // Method to get evaluation principles
  static getEvaluationPrinciples() {
    return [
      'Be strict and fair in giving feedback and scoring',
      'Only highlight genuine strengths that demonstrate real competency',
      'Identify specific areas where performance falls short of industry standards',
      'Provide actionable, evidence-based suggestions for improvement',
      'Maintain professional standards while being constructive'
    ];
  }

  static calculateVerdictFromScore(score: number): 'Strong Hire' | 'Hire' | 'Weak Hire' | 'No Hire' {
    const thresholds = InterviewAnalysisService.getScoreThresholds();
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