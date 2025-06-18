import { InterviewAnalysisService, InterviewAnalysis } from '@/app/utils/InterviewAnalysisService';
import { GoogleGenAI } from '@google/genai';

// Mock the Google GenAI module
jest.mock('@google/genai', () => ({
  GoogleGenAI: jest.fn().mockImplementation(() => ({
    models: {
      generateContent: jest.fn()
    }
  }))
}));

const mockGoogleGenAI = GoogleGenAI as jest.MockedClass<typeof GoogleGenAI>;

describe('InterviewAnalysisService', () => {
  let interviewAnalyzer: InterviewAnalysisService;
  let mockGenerateContent: jest.Mock;

  beforeEach(() => {
    mockGenerateContent = jest.fn();
    mockGoogleGenAI.mockImplementation(() => ({
      models: {
        generateContent: mockGenerateContent
      }
    }) as any);
    
    interviewAnalyzer = new InterviewAnalysisService('test-api-key');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should throw error when API key is not provided', () => {
      expect(() => new InterviewAnalysisService('')).toThrow('Gemini API key is required');
    });

    it('should create instance with valid API key', () => {
      expect(() => new InterviewAnalysisService('valid-key')).not.toThrow();
    });
  });

  describe('analyzeInterview', () => {
    const mockFeedback = [
      { question: 'Tell me about yourself', feedback: 'I am a developer' },
      { question: 'What are your strengths?', feedback: 'I am good at problem solving' }
    ];

    it('should throw error for empty feedback', async () => {
      await expect(interviewAnalyzer.analyzeInterview([])).rejects.toThrow('Interview data is required for analysis');
    });

    it('should throw error for invalid feedback format', async () => {
      const invalidFeedback = [{ question: '', feedback: 'test' }];
      await expect(interviewAnalyzer.analyzeInterview(invalidFeedback)).rejects.toThrow('Invalid feedback item');
    });

    it('should expose static utility methods', () => {
      expect(InterviewAnalysisService.getScoreThresholds()).toEqual({
        STRONG_HIRE: 90,
        HIRE: 75,
        WEAK_HIRE: 60
      });
      
      expect(InterviewAnalysisService.getScoreWeights()).toEqual({
        technicalCompetencyRelevance: 40,
        communicationStructure: 30,
        problemSolvingCriticalThinking: 20,
        preparationCulturalFit: 10
      });
      
      expect(InterviewAnalysisService.calculateVerdictFromScore(95)).toBe('Strong Hire');
      expect(InterviewAnalysisService.calculateVerdictFromScore(80)).toBe('Hire');
      expect(InterviewAnalysisService.calculateVerdictFromScore(65)).toBe('Weak Hire');
      expect(InterviewAnalysisService.calculateVerdictFromScore(40)).toBe('No Hire');
    });

    it('should expose new detailed scoring rubric', () => {
      const rubric = InterviewAnalysisService.getScoringRubric();
      
      expect(rubric.technicalCompetencyRelevance.weight).toBe(40);
      expect(rubric.communicationStructure.weight).toBe(30);
      expect(rubric.problemSolvingCriticalThinking.weight).toBe(20);
      expect(rubric.preparationCulturalFit.weight).toBe(10);
      
      expect(rubric.technicalCompetencyRelevance.criteria).toContain('Demonstrates actual knowledge and skills relevant to the role');
    });

    it('should expose evaluation principles', () => {
      const principles = InterviewAnalysisService.getEvaluationPrinciples();
      
      expect(principles).toContain('Be strict and fair in giving feedback and scoring');
      expect(principles).toContain('Only highlight genuine strengths that demonstrate real competency');
    });

    it('should create comprehensive interview data', () => {
      const questions = [
        { id: '1', question: 'Tell me about yourself', category: 'Personal', difficulty: 'Easy' as const, tips: ['Be concise'] },
        { id: '2', question: 'What are your strengths?', category: 'Skills', difficulty: 'Medium' as const, tips: ['Give examples'] }
      ];
      const responses = ['I am a developer', 'I am good at problem solving'];
      const feedbackArrays: Array<{ type: 'success' | 'warning' | 'suggestion'; text: string }[]> = [
        [{ type: 'success', text: 'Good start' }],
        [{ type: 'suggestion', text: 'Provide more details' }]
      ];

      const result = InterviewAnalysisService.createComprehensiveInterviewData(questions, responses, feedbackArrays);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: '1',
        question: 'Tell me about yourself',
        category: 'Personal',
        difficulty: 'Easy',
        tips: ['Be concise'],
        userResponse: 'I am a developer',
        aiFeedback: [{ type: 'success', text: 'Good start' }]
      });
    });

    it('should throw error for mismatched array lengths in createComprehensiveInterviewData', () => {
      const questions = [{ id: '1', question: 'Test', category: 'Personal', difficulty: 'Easy' as const, tips: [] }];
      const responses = ['Response 1', 'Response 2']; // Different length
      const feedbackArrays = [[]];

      expect(() => {
        InterviewAnalysisService.createComprehensiveInterviewData(questions, responses, feedbackArrays);
      }).toThrow('Questions, responses, and feedback arrays must have the same length');
    });

    it('should analyze interview with comprehensive data', async () => {
      const mockComprehensiveData = [
        {
          id: '1',
          question: 'Tell me about yourself',
          category: 'Personal',
          difficulty: 'Easy' as const,
          tips: ['Be concise', 'Focus on relevant experience'],
          userResponse: 'I am a senior developer with 5 years experience',
          aiFeedback: [
            { type: 'success' as const, text: 'Good length and relevant' },
            { type: 'suggestion' as const, text: 'Could add specific technologies' }
          ]
        }
      ];

      const mockAnalysis: InterviewAnalysis = {
        strengths: ['Clear communication', 'Relevant experience'],
        weaknesses: ['Could be more specific with examples'],
        suggestions: ['Use STAR method', 'Provide concrete examples'],
        score: 78,
        verdict: 'Hire',
        summary: 'Good candidate with room for improvement in specificity'
      };

      mockGenerateContent.mockResolvedValue({
        candidates: [{
          content: {
            parts: [{
              text: JSON.stringify(mockAnalysis)
            }]
          }
        }]
      });

      const result = await interviewAnalyzer.analyzeInterviewComprehensive(mockComprehensiveData);

      expect(result).toEqual(mockAnalysis);
      expect(mockGenerateContent).toHaveBeenCalledWith({
        model: 'gemini-2.0-flash-lite',
        contents: [{ 
          role: 'user', 
          parts: [{ 
            text: expect.stringContaining('You are an expert interview evaluator') 
          }] 
        }],
        config: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95
        }
      });
    });

    it('should analyze interview successfully with basic feedback data', async () => {
      const mockAnalysis: InterviewAnalysis = {
        strengths: ['Clear communication', 'Technical knowledge'],
        weaknesses: ['Could be more specific'],
        suggestions: ['Use STAR method'],
        score: 85,
        verdict: 'Hire',
        summary: 'Good candidate overall'
      };

      mockGenerateContent.mockResolvedValue({
        candidates: [{
          content: {
            parts: [{
              text: JSON.stringify(mockAnalysis)
            }]
          }
        }]
      });

      const result = await interviewAnalyzer.analyzeInterview(mockFeedback);

      expect(result).toEqual(mockAnalysis);
    });

    it('should validate comprehensive input data', async () => {
      const invalidData = [{
        id: '',
        question: 'Test question',
        category: 'Personal',
        difficulty: 'Easy' as const,
        tips: [],
        userResponse: 'Test response',
        aiFeedback: []
      }];

      await expect(interviewAnalyzer.analyzeInterviewComprehensive(invalidData))
        .rejects.toThrow('Invalid interview data at index 0: id, question, and userResponse are required');
    });

    it('should handle empty comprehensive data', async () => {
      await expect(interviewAnalyzer.analyzeInterviewComprehensive([]))
        .rejects.toThrow('Comprehensive interview data is required for analysis');
    });

    it('should validate difficulty values in comprehensive data', async () => {
      const invalidData = [{
        id: '1',
        question: 'Test question',
        category: 'Personal',
        difficulty: 'Invalid' as any,
        tips: [],
        userResponse: 'Test response',
        aiFeedback: []
      }];

      await expect(interviewAnalyzer.analyzeInterviewComprehensive(invalidData))
        .rejects.toThrow('Invalid interview data at index 0: valid category and difficulty are required');
    });

    it('should handle malformed JSON response', async () => {
      mockGenerateContent.mockResolvedValue({
        candidates: [{
          content: {
            parts: [{
              text: 'This is not valid JSON'
            }]
          }
        }]
      });

      const result = await interviewAnalyzer.analyzeInterview(mockFeedback);
      
      expect(result.verdict).toBe('Weak Hire');
      expect(result.score).toBe(50);
      expect(result.summary).toContain('technical issues');
    });

    it('should validate analysis format', async () => {
      const incompleteAnalysis = {
        strengths: ['Good'],
        // Missing required fields
      };

      mockGenerateContent.mockResolvedValue({
        candidates: [{
          content: {
            parts: [{
              text: JSON.stringify(incompleteAnalysis)
            }]
          }
        }]
      });

      const result = await interviewAnalyzer.analyzeInterview(mockFeedback);
      
      expect(result.verdict).toBe('Weak Hire');
      expect(result.score).toBe(50);
      expect(result.summary).toContain('technical issues');
    });

    it('should handle API response without candidates', async () => {
      mockGenerateContent.mockResolvedValue({
        candidates: []
      });

      const result = await interviewAnalyzer.analyzeInterview(mockFeedback);
      
      expect(result.verdict).toBe('Weak Hire');
      expect(result.score).toBe(50);
      expect(result.summary).toContain('technical issues');
    });

    it('should include all feedback in prompt', async () => {
      const mockAnalysis: InterviewAnalysis = {
        strengths: ['Good'],
        weaknesses: ['Needs work'],
        suggestions: ['Practice more'],
        score: 75,
        verdict: 'Weak Hire',
        summary: 'Okay candidate'
      };

      mockGenerateContent.mockResolvedValue({
        candidates: [{
          content: {
            parts: [{
              text: JSON.stringify(mockAnalysis)
            }]
          }
        }]
      });

      await interviewAnalyzer.analyzeInterview(mockFeedback);

      const callArgs = mockGenerateContent.mock.calls[0][0];
      const promptText = callArgs.contents[0].parts[0].text;
      
      mockFeedback.forEach(item => {
        expect(promptText).toContain(item.question);
        expect(promptText).toContain(item.feedback);
      });
    });

    it('should include stricter evaluation criteria in prompt', async () => {
      const mockAnalysis: InterviewAnalysis = {
        strengths: ['Good'],
        weaknesses: ['Needs work'],
        suggestions: ['Practice more'],
        score: 75,
        verdict: 'Weak Hire',
        summary: 'Okay candidate'
      };

      mockGenerateContent.mockResolvedValue({
        candidates: [{
          content: {
            parts: [{
              text: JSON.stringify(mockAnalysis)
            }]
          }
        }]
      });

      await interviewAnalyzer.analyzeInterview(mockFeedback);

      const callArgs = mockGenerateContent.mock.calls[0][0];
      const promptText = callArgs.contents[0].parts[0].text;
      
      // Check for expert evaluator persona
      expect(promptText).toContain('You are an expert interview evaluator');
      expect(promptText).toContain('Be strict and fair in giving feedback and scoring');
      
      // Check for detailed scoring criteria
      expect(promptText).toContain('TECHNICAL COMPETENCY & RELEVANCE (40 points)');
      expect(promptText).toContain('COMMUNICATION & STRUCTURE (30 points)');
      expect(promptText).toContain('PROBLEM-SOLVING & CRITICAL THINKING (20 points)');
      expect(promptText).toContain('PREPARATION & CULTURAL FIT (10 points)');
      
      // Check for strict thresholds explanation
      expect(promptText).toContain('Be rigorous in your assessment');
      expect(promptText).toContain('Do not inflate scores');
    });

    it('should handle network errors', async () => {
      mockGenerateContent.mockRejectedValue(new Error('Network error'));

      const result = await interviewAnalyzer.analyzeInterview(mockFeedback);
      
      expect(result.verdict).toBe('Weak Hire');
      expect(result.score).toBe(50);
      expect(result.summary).toContain('technical issues');
    });

    it('should extract JSON from complex response text', async () => {
      const mockAnalysis: InterviewAnalysis = {
        strengths: ['Good communication'],
        weaknesses: ['Needs examples'],
        suggestions: ['Use STAR method'],
        score: 80,
        verdict: 'Hire',
        summary: 'Solid candidate'
      };

      mockGenerateContent.mockResolvedValue({
        candidates: [{
          content: {
            parts: [{
              text: `Here's the analysis:\n\n${JSON.stringify(mockAnalysis)}\n\nEnd of analysis.`
            }]
          }
        }]
      });

      const result = await interviewAnalyzer.analyzeInterview(mockFeedback);

      expect(result).toEqual(mockAnalysis);
    });

    it('should validate verdict values', async () => {
      const validVerdicts = ['Strong Hire', 'Hire', 'Weak Hire', 'No Hire'];
      
      for (const verdict of validVerdicts) {
        const mockAnalysis: InterviewAnalysis = {
          strengths: ['Good'],
          weaknesses: ['Needs work'],
          suggestions: ['Practice'],
          score: 75,
          verdict: verdict as any,
          summary: 'Test'
        };

        mockGenerateContent.mockResolvedValue({
          candidates: [{
            content: {
              parts: [{
                text: JSON.stringify(mockAnalysis)
              }]
            }
          }]
        });

        const result = await interviewAnalyzer.analyzeInterview(mockFeedback);
        expect(result.verdict).toBe(verdict);
      }
    });

    it('should validate score is a number', async () => {
      const mockAnalysis = {
        strengths: ['Good'],
        weaknesses: ['Needs work'],
        suggestions: ['Practice'],
        score: '75', // String instead of number
        verdict: 'Hire',
        summary: 'Test'
      };

      mockGenerateContent.mockResolvedValue({
        candidates: [{
          content: {
            parts: [{
              text: JSON.stringify(mockAnalysis)
            }]
          }
        }]
      });

      const result = await interviewAnalyzer.analyzeInterview(mockFeedback);
      
      expect(result.verdict).toBe('Weak Hire');
      expect(result.score).toBe(50);
      expect(result.summary).toContain('technical issues');
    });
  });
});