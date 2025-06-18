import { InterviewFeedbackService, FeedbackItem } from '@/app/utils/InterviewFeedbackService';
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

describe('InterviewFeedbackService', () => {
  let feedbackGenerator: InterviewFeedbackService;
  let mockGenerateContent: jest.Mock;

  beforeEach(() => {
    mockGenerateContent = jest.fn();
    mockGoogleGenAI.mockImplementation(() => ({
      models: {
        generateContent: mockGenerateContent
      }
    }) as any);
    
    feedbackGenerator = new InterviewFeedbackService('test-api-key');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should throw error when API key is not provided', () => {
      expect(() => new InterviewFeedbackService('')).toThrow('Gemini API key is required');
    });

    it('should create instance with valid API key', () => {
      expect(() => new InterviewFeedbackService('valid-key')).not.toThrow();
    });
  });

  describe('generateFeedback', () => {
    const mockQuestion = 'Tell me about yourself';
    const mockResponse = 'I am a software developer with 5 years of experience';

    it('should generate feedback successfully with valid JSON response', async () => {
      const mockFeedback: FeedbackItem[] = [
        { type: 'success', text: 'Good structure in response' },
        { type: 'warning', text: 'Could be more specific' },
        { type: 'suggestion', text: 'Add more examples' }
      ];

      mockGenerateContent.mockResolvedValue({
        candidates: [{
          content: {
            parts: [{
              text: `Here is the feedback: ${JSON.stringify(mockFeedback)}`
            }]
          }
        }]
      });

      const result = await feedbackGenerator.generateFeedback(mockQuestion, mockResponse);

      expect(result).toEqual(mockFeedback);
      expect(mockGenerateContent).toHaveBeenCalledWith({
        model: 'gemini-2.0-flash-lite',
        contents: [{ 
          role: 'user', 
          parts: [{ 
            text: expect.stringContaining(mockQuestion) 
          }] 
        }],
        config: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95
        }
      });
    });

    it('should handle malformed JSON response gracefully', async () => {
      mockGenerateContent.mockResolvedValue({
        candidates: [{
          content: {
            parts: [{
              text: 'This is not valid JSON response'
            }]
          }
        }]
      });

      const result = await feedbackGenerator.generateFeedback(mockQuestion, mockResponse);

      expect(result).toEqual([{
        type: 'warning',
        text: 'Unable to generate AI feedback at this time. Please try again later.'
      }]);
    });

    it('should handle API response without candidates', async () => {
      mockGenerateContent.mockResolvedValue({
        candidates: []
      });

      const result = await feedbackGenerator.generateFeedback(mockQuestion, mockResponse);
      
      expect(result).toEqual([{
        type: 'warning',
        text: 'Unable to generate AI feedback at this time. Please try again later.'
      }]);
    });

    it('should handle API response without content', async () => {
      mockGenerateContent.mockResolvedValue({
        candidates: [{
          content: null
        }]
      });

      const result = await feedbackGenerator.generateFeedback(mockQuestion, mockResponse);
      
      expect(result).toEqual([{
        type: 'warning',
        text: 'Unable to generate AI feedback at this time. Please try again later.'
      }]);
    });

    it('should handle network errors gracefully', async () => {
      mockGenerateContent.mockRejectedValue(new Error('Network error'));

      const result = await feedbackGenerator.generateFeedback(mockQuestion, mockResponse);
      
      expect(result).toEqual([{
        type: 'warning',
        text: 'Unable to generate AI feedback at this time. Please try again later.'
      }]);
    });

    it('should include question and response in the prompt', async () => {
      mockGenerateContent.mockResolvedValue({
        candidates: [{
          content: {
            parts: [{
              text: '[{"type": "success", "text": "Good response"}]'
            }]
          }
        }]
      });

      await feedbackGenerator.generateFeedback(mockQuestion, mockResponse);

      const callArgs = mockGenerateContent.mock.calls[0][0];
      const promptText = callArgs.contents[0].parts[0].text;
      
      expect(promptText).toContain(mockQuestion);
      expect(promptText).toContain(mockResponse);
    });

    it('should extract JSON from complex response text', async () => {
      const mockFeedback: FeedbackItem[] = [
        { type: 'success', text: 'Well structured answer' }
      ];

      mockGenerateContent.mockResolvedValue({
        candidates: [{
          content: {
            parts: [{
              text: `Here's my analysis:

${JSON.stringify(mockFeedback)}

That's the feedback.`
            }]
          }
        }]
      });

      const result = await feedbackGenerator.generateFeedback(mockQuestion, mockResponse);

      expect(result).toEqual(mockFeedback);
    });

    describe('Response Quality Validation', () => {
      it('should handle too short responses without AI call', async () => {
        const shortResponse = 'test';
        
        const result = await feedbackGenerator.generateFeedback(mockQuestion, shortResponse);
        
        expect(result).toHaveLength(2);
        expect(result[0].type).toBe('warning');
        expect(result[0].text).toContain('too brief');
        expect(result[1].type).toBe('suggestion');
        expect(result[1].text).toContain('elaborate');
        expect(mockGenerateContent).not.toHaveBeenCalled();
      });

      it('should handle nonsensical sequential character responses', async () => {
        const nonsensicalResponse = 'abcdefghijklmnop';
        
        const result = await feedbackGenerator.generateFeedback(mockQuestion, nonsensicalResponse);
        
        expect(result).toHaveLength(2);
        expect(result[0].type).toBe('warning');
        expect(result[0].text).toContain('random text or characters');
        expect(result[1].type).toBe('suggestion');
        expect(result[1].text).toContain('thoughtful, relevant response');
        expect(mockGenerateContent).not.toHaveBeenCalled();
      });

      it('should handle repeated character responses', async () => {
        const repeatedResponse = 'aaaaaaaaaaa';
        
        const result = await feedbackGenerator.generateFeedback(mockQuestion, repeatedResponse);
        
        expect(result).toHaveLength(2);
        expect(result[0].type).toBe('warning');
        expect(result[0].text).toContain('random text or characters');
        expect(mockGenerateContent).not.toHaveBeenCalled();
      });

      it('should handle keyboard mashing responses', async () => {
        const mashingResponse = 'asdfghjklqwertyuiop';
        
        const result = await feedbackGenerator.generateFeedback(mockQuestion, mashingResponse);
        
        expect(result).toHaveLength(2);
        expect(result[0].type).toBe('warning');
        expect(result[0].text).toContain('random text or characters');
        expect(mockGenerateContent).not.toHaveBeenCalled();
      });

      it('should handle repetitive word responses', async () => {
        const repetitiveResponse = 'test test test test test test';
        
        const result = await feedbackGenerator.generateFeedback(mockQuestion, repetitiveResponse);
        
        expect(result).toHaveLength(2);
        expect(result[0].type).toBe('warning');
        expect(result[0].text).toContain('lacks sufficient detail');
        expect(result[1].type).toBe('suggestion');
        expect(result[1].text).toContain('specific examples');
        expect(mockGenerateContent).not.toHaveBeenCalled();
      });

      it('should handle responses with insufficient word count', async () => {
        const insufficientResponse = 'yes no';
        
        const result = await feedbackGenerator.generateFeedback(mockQuestion, insufficientResponse);
        
        expect(result).toHaveLength(2);
        expect(result[0].type).toBe('warning');
        expect(result[0].text).toContain('too brief');
        expect(mockGenerateContent).not.toHaveBeenCalled();
      });

      it('should allow quality responses to proceed to AI analysis', async () => {
        const qualityResponse = 'I am a software developer with 5 years of experience in building web applications using React and Node.js.';
        
        const mockFeedback: FeedbackItem[] = [
          { type: 'success', text: 'Good technical background mentioned' },
          { type: 'suggestion', text: 'Consider adding specific project examples' }
        ];

        mockGenerateContent.mockResolvedValue({
          candidates: [{
            content: {
              parts: [{
                text: JSON.stringify(mockFeedback)
              }]
            }
          }]
        });
        
        const result = await feedbackGenerator.generateFeedback(mockQuestion, qualityResponse);
        
        expect(result).toEqual(mockFeedback);
        expect(mockGenerateContent).toHaveBeenCalled();
      });

      it('should handle edge case with whitespace-only response', async () => {
        const whitespaceResponse = '   \n\t   ';
        
        await expect(feedbackGenerator.generateFeedback(mockQuestion, whitespaceResponse))
          .rejects.toThrow('Question and response are required');
        
        expect(mockGenerateContent).not.toHaveBeenCalled();
      });

      it('should handle mixed quality response with some meaningful content', async () => {
        const mixedResponse = 'I have experience in software development and testing different applications.';
        
        const mockFeedback: FeedbackItem[] = [
          { type: 'warning', text: 'Response could be more specific' },
          { type: 'suggestion', text: 'Add concrete examples of your work' }
        ];

        mockGenerateContent.mockResolvedValue({
          candidates: [{
            content: {
              parts: [{
                text: JSON.stringify(mockFeedback)
              }]
            }
          }]
        });
        
        const result = await feedbackGenerator.generateFeedback(mockQuestion, mixedResponse);
        
        expect(result).toEqual(mockFeedback);
        expect(mockGenerateContent).toHaveBeenCalled();
      });
    });
  });
});