import { TextToSpeech } from '@/app/utils/TextToSpeech';
import { GoogleGenAI } from '@google/genai';
import { AudioCacheManager } from '@/app/utils/AudioCacheManager';

// Mock the Google GenAI module
jest.mock('@google/genai', () => ({
  GoogleGenAI: jest.fn().mockImplementation(() => ({
    models: {
      generateContentStream: jest.fn()
    }
  }))
}));

// Mock the mime module
jest.mock('mime', () => ({
  getExtension: jest.fn((mimeType) => {
    if (mimeType?.includes('wav')) return 'wav';
    if (mimeType?.includes('mp3')) return 'mp3';
    return null;
  })
}));

// Mock the AudioCacheManager
jest.mock('@/app/utils/AudioCacheManager', () => ({
  AudioCacheManager: jest.fn().mockImplementation(() => ({
    generateCacheKey: jest.fn(),
    getCachedAudio: jest.fn(),
    cacheAudio: jest.fn(),
    startNewSession: jest.fn(),
    getStats: jest.fn(),
    getHitRate: jest.fn(),
    getFormattedCacheSize: jest.fn(),
    clearAllCache: jest.fn()
  }))
}));

const mockGoogleGenAI = GoogleGenAI as jest.MockedClass<typeof GoogleGenAI>;
const mockAudioCacheManager = AudioCacheManager as jest.MockedClass<typeof AudioCacheManager>;

describe('TextToSpeech', () => {
  let textToSpeech: TextToSpeech;
  let mockGenerateContentStream: jest.Mock;
  let mockCacheManager: jest.Mocked<AudioCacheManager>;

  beforeEach(() => {
    mockGenerateContentStream = jest.fn();
    mockGoogleGenAI.mockImplementation(() => ({
      models: {
        generateContentStream: mockGenerateContentStream
      }
    }) as any);
    
    mockCacheManager = {
      generateCacheKey: jest.fn(),
      getCachedAudio: jest.fn(),
      cacheAudio: jest.fn(),
      startNewSession: jest.fn(),
      getStats: jest.fn(),
      getHitRate: jest.fn(),
      getFormattedCacheSize: jest.fn(),
      clearAllCache: jest.fn()
    } as any;
    
    mockAudioCacheManager.mockImplementation(() => mockCacheManager);
    
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
    it('should generate speech successfully with caching', async () => {
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

      // Mock cache miss (no cached audio)
      mockCacheManager.generateCacheKey.mockReturnValue('test-cache-key');
      mockCacheManager.getCachedAudio.mockResolvedValue(null);
      mockCacheManager.cacheAudio.mockResolvedValue(undefined);

      // Mock async iterator
      mockGenerateContentStream.mockResolvedValue({
        [Symbol.asyncIterator]: async function* () {
          yield mockChunk;
        }
      });

      const result = await textToSpeech.generateSpeech('Hello world');

      expect(result).toBeInstanceOf(Buffer);
      expect(mockCacheManager.generateCacheKey).toHaveBeenCalled();
      expect(mockCacheManager.getCachedAudio).toHaveBeenCalledWith('test-cache-key');
      expect(mockCacheManager.cacheAudio).toHaveBeenCalledWith('test-cache-key', expect.any(Buffer));
      expect(mockGenerateContentStream).toHaveBeenCalledWith({
        model: 'gemini-2.5-flash-preview-tts',
        config: expect.objectContaining({
          temperature: 1,
          responseModalities: ['audio']
        }),
        contents: [{
          role: 'user',
          parts: [{ text: 'Hello world' }]
        }]
      });
    });

    it('should return cached audio when available', async () => {
      const cachedBuffer = Buffer.from('cached audio data');
      
      mockCacheManager.generateCacheKey.mockReturnValue('test-cache-key');
      mockCacheManager.getCachedAudio.mockResolvedValue(cachedBuffer);

      const result = await textToSpeech.generateSpeech('Hello world');

      expect(result).toBe(cachedBuffer);
      expect(mockCacheManager.getCachedAudio).toHaveBeenCalledWith('test-cache-key');
      expect(mockGenerateContentStream).not.toHaveBeenCalled();
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

    it('should handle multiple chunks and concatenate them', async () => {
      const mockAudioData1 = 'base64audiodata1';
      const mockAudioData2 = 'base64audiodata2';
      const mockChunks = [
        { candidates: [] }, // Invalid chunk
        { 
          candidates: [{
            content: {
              parts: [{
                inlineData: {
                  mimeType: 'audio/wav',
                  data: mockAudioData1
                }
              }]
            }
          }]
        }, // First valid chunk
        { 
          candidates: [{
            content: {
              parts: [{
                inlineData: {
                  mimeType: 'audio/wav',
                  data: mockAudioData2
                }
              }]
            }
          }]
        } // Second valid chunk
      ];

      // Mock cache miss and successful caching
      mockCacheManager.generateCacheKey.mockReturnValue('test-cache-key');
      mockCacheManager.getCachedAudio.mockResolvedValue(null);
      mockCacheManager.cacheAudio.mockResolvedValue(undefined);

      mockGenerateContentStream.mockResolvedValue({
        [Symbol.asyncIterator]: async function* () {
          for (const chunk of mockChunks) {
            yield chunk;
          }
        }
      });

      const result = await textToSpeech.generateSpeech('Hello');
      
      // Should concatenate both chunks
      const expectedBuffer = Buffer.concat([
        Buffer.from(mockAudioData1, 'base64'),
        Buffer.from(mockAudioData2, 'base64')
      ]);
      expect(result).toEqual(expectedBuffer);
    });

    it('should handle cache errors gracefully', async () => {
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

      // Mock cache failure
      mockCacheManager.generateCacheKey.mockReturnValue('test-cache-key');
      mockCacheManager.getCachedAudio.mockResolvedValue(null);
      mockCacheManager.cacheAudio.mockRejectedValue(new Error('Cache write failed'));

      // Mock async iterator
      mockGenerateContentStream.mockResolvedValue({
        [Symbol.asyncIterator]: async function* () {
          yield mockChunk;
        }
      });

      // Should still return audio even if caching fails
      const result = await textToSpeech.generateSpeech('Hello world');
      expect(result).toBeInstanceOf(Buffer);
    });
  });

  describe('cache management methods', () => {
    it('should start new session', async () => {
      await textToSpeech.startNewSession();
      expect(mockCacheManager.startNewSession).toHaveBeenCalled();
    });

    it('should get cache stats', () => {
      const mockStats = { hits: 5, misses: 2, totalSize: 1024, fileCount: 7 };
      mockCacheManager.getStats.mockReturnValue(mockStats);
      
      const stats = textToSpeech.getCacheStats();
      expect(stats).toBe(mockStats);
    });

    it('should get cache hit rate', () => {
      mockCacheManager.getHitRate.mockReturnValue(75.5);
      
      const hitRate = textToSpeech.getCacheHitRate();
      expect(hitRate).toBe(75.5);
    });

    it('should get formatted cache size', () => {
      mockCacheManager.getFormattedCacheSize.mockReturnValue('1.5 MB');
      
      const size = textToSpeech.getFormattedCacheSize();
      expect(size).toBe('1.5 MB');
    });

    it('should clear cache', async () => {
      await textToSpeech.clearCache();
      expect(mockCacheManager.clearAllCache).toHaveBeenCalled();
    });
  });
});