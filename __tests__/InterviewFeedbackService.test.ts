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
      expect(() => new FeedbackGenerator('')).toThrow('Gemini API key is required');
    });

    it('should create instance with valid API key', () => {
      expect(() => new FeedbackGenerator('valid-key')).not.toThrow();
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
        text: 'Unable to generate feedback. Please try again.'
      }]);
    });

    it('should handle API response without candidates', async () => {
      mockGenerateContent.mockResolvedValue({
        candidates: []
      });

      await expect(feedbackGenerator.generateFeedback(mockQuestion, mockResponse))
        .rejects.toThrow('No valid response from AI');
    });

    it('should handle API response without content', async () => {
      mockGenerateContent.mockResolvedValue({
        candidates: [{
          content: null
        }]
      });

      await expect(feedbackGenerator.generateFeedback(mockQuestion, mockResponse))
        .rejects.toThrow('No valid response from AI');
    });

    it('should handle network errors gracefully', async () => {
      mockGenerateContent.mockRejectedValue(new Error('Network error'));

      await expect(feedbackGenerator.generateFeedback(mockQuestion, mockResponse))
        .rejects.toThrow('Network error');
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
  });
});