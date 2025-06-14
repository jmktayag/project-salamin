import { BaseAIService } from './BaseAIService';
import mime from 'mime';

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

  /**
   * Creates a new TextToSpeech instance
   * @param apiKey - Google Gemini API key
   * @throws Error if API key is not provided
   */
  constructor(apiKey?: string) {
    super('TextToSpeech', apiKey);
  }

  /**
   * Generates speech from the given text using Gemini AI
   * @param text - The text to convert to speech
   * @returns Promise<Buffer> - Audio data as a Buffer
   * @throws Error if no audio data is received
   */
  async generateSpeech(text: string): Promise<Buffer> {

    if (!text || text.trim().length === 0) {
      throw new Error('Text is required');
    }

    this.validateTextInput(text);

    return await this.withRetry(async () => {
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
  }

  /**
   * Process the audio stream and return the first valid audio buffer
   */
  private async processAudioStream(response: AsyncIterable<any>): Promise<Buffer> {
    for await (const chunk of response) {
      const audioBuffer = this.extractAudioFromChunk(chunk);
      if (audioBuffer) {
        return audioBuffer;
      }
    }
    
    throw new Error('No audio data received');
  }

  /**
   * Extract audio data from a response chunk
   */
  private extractAudioFromChunk(chunk: any): Buffer | null {
    if (!chunk.candidates?.[0]?.content?.parts?.[0]?.inlineData) {
      return null;
    }

    const inlineData = chunk.candidates[0].content.parts[0].inlineData;
    let fileExtension = mime.getExtension(inlineData.mimeType || '');
    let buffer: Buffer;

    try {
      if (!fileExtension) {
        fileExtension = 'wav';
        buffer = this.convertToWav(inlineData.data || '', inlineData.mimeType || '');
      } else {
        buffer = Buffer.from(inlineData.data || '', 'base64');
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
    const [_, format] = fileType.split('/');

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
} 