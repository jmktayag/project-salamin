import { InterviewAnalysisService, InterviewAnalysis, FeedbackItem, ComprehensiveQuestionData, QuestionFeedback } from '@/app/utils/InterviewAnalysisService';
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
      expect(() => new InterviewAnalyzer('')).toThrow('Gemini API key is required');
    });

    it('should create instance with valid API key', () => {
      expect(() => new InterviewAnalyzer('valid-key')).not.toThrow();
    });
  });

  describe('analyzeInterview', () => {
    const mockFeedback: FeedbackItem[] = [
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
      expect(InterviewAnalyzer.getScoreThresholds()).toEqual({
        STRONG_HIRE: 90,
        HIRE: 75,
        WEAK_HIRE: 60
      });
      
      expect(InterviewAnalyzer.getScoreWeights()).toEqual({
        relevanceAndClarity: 50,
        rolefit: 30,
        enthusiasmAndGrowth: 20
      });
      
      expect(InterviewAnalyzer.calculateVerdictFromScore(95)).toBe('Strong Hire');
      expect(InterviewAnalyzer.calculateVerdictFromScore(80)).toBe('Hire');
      expect(InterviewAnalyzer.calculateVerdictFromScore(65)).toBe('Weak Hire');
      expect(InterviewAnalyzer.calculateVerdictFromScore(40)).toBe('No Hire');
    });

    it('should create comprehensive interview data', () => {
      const questions = [
        { id: '1', question: 'Tell me about yourself', category: 'Personal', difficulty: 'Easy' as const, tips: ['Be concise'] },
        { id: '2', question: 'What are your strengths?', category: 'Skills', difficulty: 'Medium' as const, tips: ['Give examples'] }
      ];
      const responses = ['I am a developer', 'I am good at problem solving'];
      const feedbackArrays: QuestionFeedback[][] = [
        [{ type: 'success', text: 'Good start' }],
        [{ type: 'suggestion', text: 'Provide more details' }]
      ];

      const result = InterviewAnalyzer.createComprehensiveInterviewData(questions, responses, feedbackArrays);

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
      const feedbackArrays: QuestionFeedback[][] = [[]];

      expect(() => {
        InterviewAnalyzer.createComprehensiveInterviewData(questions, responses, feedbackArrays);
      }).toThrow('Questions, responses, and feedback arrays must have the same length');
    });

    it('should analyze interview with comprehensive data', async () => {
      const mockComprehensiveData: ComprehensiveQuestionData[] = [
        {
          id: '1',
          question: 'Tell me about yourself',
          category: 'Personal',
          difficulty: 'Easy',
          tips: ['Be concise', 'Focus on relevant experience'],
          userResponse: 'I am a senior developer with 5 years experience',
          aiFeedback: [
            { type: 'success', text: 'Good length and relevant' },
            { type: 'suggestion', text: 'Could add specific technologies' }
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
            text: expect.stringContaining('COMPREHENSIVE INTERVIEW DATA') 
          }] 
        }],
        config: {
          temperature: 0.3,
          topK: 20,
          topP: 0.8
        }
      });

      // Verify comprehensive prompt includes all data
      const callArgs = mockGenerateContent.mock.calls[0][0];
      const promptText = callArgs.contents[0].parts[0].text;
      
      expect(promptText).toContain('Personal | Easy');
      expect(promptText).toContain('SUCCESS: Good length and relevant');
      expect(promptText).toContain('Be concise');
      expect(promptText).toContain('CONTEXTUAL ANALYSIS FACTORS');
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
        .rejects.toThrow('Interview data is required for analysis');
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