import { BaseAIService } from './BaseAIService';
import mime from 'mime';
import { AudioCacheManager, AudioCacheConfig } from './AudioCacheManager';

/**
 * Configuration options for WAV audio conversion
 */
interface WavConversionOptions {
  /** Number of audio channels (1 for mono, 2 for stereo) */
  numChannels: number;
  /** Sample rate in Hz (e.g., 44100 for CD quality) */
  sampleRate: number;
  /** Bits per sample (e.g., 16 for CD quality) */
  bitsPerSample: number;
}

const TTS_MODEL = 'gemini-2.5-flash-preview-tts';

/**
 * TextToSpeech class that uses Google's Gemini AI to convert text to speech
 * and handles audio format conversion to WAV when necessary.
 * Includes audio caching for improved performance and reduced API costs.
 */
export class TextToSpeech extends BaseAIService {
  private ttsConfig = {
    temperature: 1,
    responseModalities: ['audio'],
    speechConfig: {
      voiceConfig: {
        prebuiltVoiceConfig: {
          voiceName: 'Zephyr',
        }
      }
    },
  };

  private cacheManager: AudioCacheManager;

  /**
   * Creates a new TextToSpeech instance
   * @param apiKey - Google Gemini API key
   * @param cacheConfig - Optional cache configuration
   * @throws Error if API key is not provided
   */
  constructor(apiKey?: string, cacheConfig?: Partial<AudioCacheConfig>) {
    super('TextToSpeech', apiKey);
    this.cacheManager = new AudioCacheManager(cacheConfig);
    
    // Clear existing cache on initialization to fix hash key issue
    if (process.env.NODE_ENV === 'development') {
      this.cacheManager.clearAllCache().then(() => {
        console.log('TTS: Cache cleared due to hash function update');
      });
    }
  }

  /**
   * Generates speech from the given text using Gemini AI with caching
   * @param text - The text to convert to speech
   * @returns Promise<Buffer> - Audio data as a Buffer
   * @throws Error if no audio data is received
   */
  async generateSpeech(text: string): Promise<Buffer> {
    if (!text || text.trim().length === 0) {
      throw new Error('Text is required');
    }

    this.validateTextInput(text);

    // Generate cache key based on text and voice configuration
    const cacheKey = this.cacheManager.generateCacheKey(text, this.ttsConfig);
    if (process.env.NODE_ENV === 'development') {
      console.log('TTS: Generated cache key for text:', text.substring(0, 50), 'Key:', cacheKey);
    }

    // Try to get cached audio first
    const cachedAudio = await this.cacheManager.getCachedAudio(cacheKey);
    if (cachedAudio) {
      if (process.env.NODE_ENV === 'development') {
        console.log('TTS: Using cached audio, size:', cachedAudio.length);
      }
      return cachedAudio;
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('TTS: No cached audio found, generating new audio');
    }

    // Generate new audio if not cached
    const audioBuffer = await this.withRetry(async () => {
      const contents = [{
        role: 'user',
        parts: [{ text }],
      }];

      const response = await this.ai.models.generateContentStream({
        model: TTS_MODEL,
        config: this.ttsConfig,
        contents,
      });

      return await this.processAudioStream(response);
    });

    if (process.env.NODE_ENV === 'development') {
      console.log('TTS: Generated new audio, size:', audioBuffer.length);
    }

    // Cache the generated audio
    try {
      await this.cacheManager.cacheAudio(cacheKey, audioBuffer);
      if (process.env.NODE_ENV === 'development') {
        console.log('TTS: Successfully cached audio');
      }
    } catch (error) {
      // Log error but don't fail the request if caching fails
      if (process.env.NODE_ENV === 'development') {
        console.warn('Failed to cache audio:', error);
      }
    }

    return audioBuffer;
  }

  /**
   * Process the audio stream and collect all audio chunks
   * Based on Google's reference implementation that handles multiple chunks
   */
  private async processAudioStream(response: AsyncIterable<unknown>): Promise<Buffer> {
    const audioChunks: Buffer[] = [];
    
    for await (const chunk of response) {
      const audioBuffer = this.extractAudioFromChunk(chunk);
      if (audioBuffer) {
        audioChunks.push(audioBuffer);
        if (process.env.NODE_ENV === 'development') {
          console.log(`TTS: Received audio chunk ${audioChunks.length}, size: ${audioBuffer.length}`);
        }
      }
    }
    
    if (audioChunks.length === 0) {
      throw new Error('No audio data received');
    }
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`TTS: Total audio chunks received: ${audioChunks.length}`);
    }
    
    // If multiple chunks, concatenate them; otherwise return the single chunk
    if (audioChunks.length === 1) {
      return audioChunks[0];
    } else {
      // Concatenate multiple audio chunks
      const concatenated = Buffer.concat(audioChunks);
      if (process.env.NODE_ENV === 'development') {
        console.log(`TTS: Concatenated ${audioChunks.length} chunks into ${concatenated.length} bytes`);
      }
      return concatenated;
    }
  }

  /**
   * Extract audio data from a response chunk
   */
  private extractAudioFromChunk(chunk: unknown): Buffer | null {
    const chunkObj = chunk as Record<string, unknown>;
    const candidates = chunkObj.candidates as Array<Record<string, unknown>>;
    
    if (!candidates?.[0]) {
      return null;
    }
    
    const content = candidates[0].content as Record<string, unknown>;
    const parts = content?.parts as Array<Record<string, unknown>>;
    const inlineData = parts?.[0]?.inlineData as Record<string, unknown>;
    
    if (!inlineData) {
      return null;
    }
    const mimeType = inlineData.mimeType as string;
    const data = inlineData.data as string;
    
    let fileExtension = mime.getExtension(mimeType || '');
    let buffer: Buffer;

    try {
      if (!fileExtension) {
        fileExtension = 'wav';
        buffer = this.convertToWav(data || '', mimeType || '');
      } else {
        buffer = Buffer.from(data || '', 'base64');
      }

      return buffer;
    } catch (error) {
      console.error('Failed to process audio data:', error);
      return null;
    }
  }

  /**
   * Validate text input for speech generation
   */
  private validateTextInput(text: string): void {
    if (text.length > 5000) {
      throw new Error('Text is too long. Maximum length is 5000 characters.');
    }
  }

  /**
   * Converts raw audio data to WAV format
   * @param rawData - Base64 encoded raw audio data
   * @param mimeType - MIME type of the raw audio data
   * @returns Buffer containing WAV formatted audio data
   */
  private convertToWav(rawData: string, mimeType: string): Buffer {
    const options = this.parseMimeType(mimeType);
    const wavHeader = this.createWavHeader(rawData.length, options);
    const buffer = Buffer.from(rawData, 'base64');


    return Buffer.concat([wavHeader, buffer]);
  }

  /**
   * Parses MIME type string to extract audio format parameters
   * @param mimeType - MIME type string (e.g., 'audio/L16;rate=44100')
   * @returns WavConversionOptions object with parsed parameters
   */
  private parseMimeType(mimeType: string): WavConversionOptions {
    const [fileType, ...params] = mimeType.split(';').map(s => s.trim());
    const [, format] = fileType.split('/');

    const options: Partial<WavConversionOptions> = {
      numChannels: 1,
    };

    if (format && format.startsWith('L')) {
      const bits = parseInt(format.slice(1), 10);
      if (!isNaN(bits)) {
        options.bitsPerSample = bits;
      }
    }

    for (const param of params) {
      const [key, value] = param.split('=').map(s => s.trim());
      if (key === 'rate') {
        options.sampleRate = parseInt(value, 10);
      }
    }


    return options as WavConversionOptions;
  }

  /**
   * Creates a WAV file header with the specified audio parameters
   * @param dataLength - Length of the audio data in bytes
   * @param options - Audio format options
   * @returns Buffer containing the WAV header
   */
  private createWavHeader(dataLength: number, options: WavConversionOptions): Buffer {
    const { numChannels, sampleRate, bitsPerSample } = options;
    const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
    const blockAlign = (numChannels * bitsPerSample) / 8;
    const buffer = Buffer.alloc(44);

    buffer.write('RIFF', 0);                      // ChunkID
    buffer.writeUInt32LE(36 + dataLength, 4);     // ChunkSize
    buffer.write('WAVE', 8);                      // Format
    buffer.write('fmt ', 12);                     // Subchunk1ID
    buffer.writeUInt32LE(16, 16);                 // Subchunk1Size (PCM)
    buffer.writeUInt16LE(1, 20);                  // AudioFormat (1 = PCM)
    buffer.writeUInt16LE(numChannels, 22);        // NumChannels
    buffer.writeUInt32LE(sampleRate, 24);         // SampleRate
    buffer.writeUInt32LE(byteRate, 28);           // ByteRate
    buffer.writeUInt16LE(blockAlign, 32);         // BlockAlign
    buffer.writeUInt16LE(bitsPerSample, 34);      // BitsPerSample
    buffer.write('data', 36);                     // Subchunk2ID
    buffer.writeUInt32LE(dataLength, 40);         // Subchunk2Size


    return buffer;
  }

  /**
   * Start a new interview session and clear the audio cache
   */
  async startNewSession(): Promise<void> {
    await this.cacheManager.startNewSession();
  }

  /**
   * Get cache statistics for monitoring
   */
  getCacheStats() {
    return this.cacheManager.getStats();
  }

  /**
   * Get cache hit rate as percentage
   */
  getCacheHitRate(): number {
    return this.cacheManager.getHitRate();
  }

  /**
   * Get formatted cache size
   */
  getFormattedCacheSize(): string {
    return this.cacheManager.getFormattedCacheSize();
  }

  /**
   * Clear all cached audio files
   */
  async clearCache(): Promise<void> {
    await this.cacheManager.clearAllCache();
  }
} 