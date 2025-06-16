import { TextToSpeech } from '@/app/utils/TextToSpeech';
import { GoogleGenAI } from '@google/genai';

// Mock the Google GenAI module
jest.mock('@google/genai', () => ({
  GoogleGenAI: jest.fn().mockImplementation(() => ({
    models: {
      generateContentStream: jest.fn()
    }
  }))
}));

const mockGoogleGenAI = GoogleGenAI as jest.MockedClass<typeof GoogleGenAI>;

describe('TextToSpeech', () => {
  let textToSpeech: TextToSpeech;
  let mockGenerateContentStream: jest.Mock;

  beforeEach(() => {
    mockGenerateContentStream = jest.fn();
    mockGoogleGenAI.mockImplementation(() => ({
      models: {
        generateContentStream: mockGenerateContentStream
      }
    }) as any);
    
    textToSpeech = new TextToSpeech('test-api-key');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should throw error when API key is not provided', () => {
      expect(() => new TextToSpeech('')).toThrow('Gemini API key is required');
    });

    it('should create instance with valid API key', () => {
      expect(() => new TextToSpeech('valid-key')).not.toThrow();
    });
  });

  describe('generateSpeech', () => {
    it('should generate speech successfully', async () => {
      const mockAudioData = 'base64audiodata';
      const mockChunk = {
        candidates: [{
          content: {
            parts: [{
              inlineData: {
                mimeType: 'audio/wav',
                data: mockAudioData
              }
            }]
          }
        }]
      };

      // Mock async iterator
      mockGenerateContentStream.mockResolvedValue({
        [Symbol.asyncIterator]: async function* () {
          yield mockChunk;
        }
      });

      const result = await textToSpeech.generateSpeech('Hello world');

      expect(result).toBeInstanceOf(Buffer);
      expect(mockGenerateContentStream).toHaveBeenCalledWith({
        model: 'gemini-2.5-flash-preview-tts',
        contents: [{
          role: 'user',
          parts: [{
            text: 'Hello world'
          }]
        }],
        config: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95
        }
      });
    });

    it('should handle empty text input', async () => {
      await expect(textToSpeech.generateSpeech('')).rejects.toThrow('Text is required');
    });

    it('should handle response without audio data', async () => {
      const mockChunk = {
        candidates: [{
          content: {
            parts: [{}] // No inlineData
          }
        }]
      };

      mockGenerateContentStream.mockResolvedValue({
        [Symbol.asyncIterator]: async function* () {
          yield mockChunk;
        }
      });

      await expect(textToSpeech.generateSpeech('Hello')).rejects.toThrow('No audio data received');
    });

    it('should handle response without candidates', async () => {
      const mockChunk = {
        candidates: []
      };

      mockGenerateContentStream.mockResolvedValue({
        [Symbol.asyncIterator]: async function* () {
          yield mockChunk;
        }
      });

      await expect(textToSpeech.generateSpeech('Hello')).rejects.toThrow('No audio data received');
    });

    it('should handle network errors', async () => {
      mockGenerateContentStream.mockRejectedValue(new Error('Network error'));

      await expect(textToSpeech.generateSpeech('Hello')).rejects.toThrow('Network error');
    });

    it('should convert base64 to buffer correctly', async () => {
      const testData = 'SGVsbG8gV29ybGQ='; // "Hello World" in base64
      const mockChunk = {
        candidates: [{
          content: {
            parts: [{
              inlineData: {
                mimeType: 'audio/wav',
                data: testData
              }
            }]
          }
        }]
      };

      mockGenerateContentStream.mockResolvedValue({
        [Symbol.asyncIterator]: async function* () {
          yield mockChunk;
        }
      });

      const result = await textToSpeech.generateSpeech('Hello');
      
      expect(result).toBeInstanceOf(Buffer);
      expect(result.toString()).toBe('Hello World');
    });

    it('should handle multiple chunks and return first valid one', async () => {
      const mockAudioData = 'base64audiodata';
      const mockChunks = [
        { candidates: [] }, // Invalid chunk
        { 
          candidates: [{
            content: {
              parts: [{
                inlineData: {
                  mimeType: 'audio/wav',
                  data: mockAudioData
                }
              }]
            }
          }]
        }, // Valid chunk
        { 
          candidates: [{
            content: {
              parts: [{
                inlineData: {
                  mimeType: 'audio/wav',
                  data: 'secondchunk'
                }
              }]
            }
          }]
        } // Another valid chunk (should be ignored)
      ];

      mockGenerateContentStream.mockResolvedValue({
        [Symbol.asyncIterator]: async function* () {
          for (const chunk of mockChunks) {
            yield chunk;
          }
        }
      });

      const result = await textToSpeech.generateSpeech('Hello');
      
      // Should return the first valid chunk's data
      expect(Buffer.from(mockAudioData, 'base64').equals(result)).toBe(true);
    });
  });
});