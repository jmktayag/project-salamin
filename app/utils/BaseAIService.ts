/**
 * Base class for AI services using Google Gemini API
 * Provides common functionality and reduces code duplication
 */

import { GoogleGenAI } from '@google/genai';

export interface AIConfig {
  temperature: number;
  topK: number;
  topP: number;
}

export interface GenerateContentOptions {
  model: string;
  prompt: string;
  config?: Partial<AIConfig>;
}

export interface GenerateStreamOptions extends GenerateContentOptions {
  // Additional options specific to streaming
}

export abstract class BaseAIService {
  protected ai: GoogleGenAI;
  protected defaultConfig: AIConfig;
  protected serviceName: string;

  constructor(serviceName: string, apiKey?: string) {
    this.serviceName = serviceName;
    
    // Get API key from parameter or environment
    const finalApiKey = apiKey || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    
    if (!finalApiKey) {
      throw new Error(`${serviceName}: Gemini API key is required`);
    }

    this.ai = new GoogleGenAI({ apiKey: finalApiKey });
    this.defaultConfig = {
      temperature: 0.7,
      topK: 40,
      topP: 0.95
    };
  }

  /**
   * Generate content using Gemini API with error handling
   */
  protected async generateContent(options: GenerateContentOptions): Promise<string> {
    const { model, prompt, config } = options;
    const finalConfig = { ...this.defaultConfig, ...config };
    
    const result = await this.ai.models.generateContent({
      model,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: finalConfig
    });

    return this.extractTextFromResponse(result);
  }

  /**
   * Generate content stream using Gemini API
   */
  protected async generateContentStream(options: GenerateStreamOptions): Promise<AsyncIterable<any>> {
    const { model, prompt, config } = options;
    const finalConfig = { ...this.defaultConfig, ...config };
    
    return await this.ai.models.generateContentStream({
      model,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: finalConfig
    });
  }

  /**
   * Extract text from Gemini API response with validation
   */
  protected extractTextFromResponse(result: any): string {
    if (!result.candidates?.[0]?.content?.parts?.[0]?.text) {
      throw new Error('No valid response from AI');
    }

    return result.candidates[0].content.parts[0].text;
  }

  /**
   * Optimized JSON extraction using string operations instead of regex
   */
  protected parseJSONOptimized<T>(responseText: string): T {
    // Find the start and end of JSON structure
    const arrayStart = responseText.indexOf('[');
    const objectStart = responseText.indexOf('{');
    
    let startIndex = -1;
    let endChar = '';
    
    if (arrayStart !== -1 && (objectStart === -1 || arrayStart < objectStart)) {
      startIndex = arrayStart;
      endChar = ']';
    } else if (objectStart !== -1) {
      startIndex = objectStart;
      endChar = '}';
    }
    
    if (startIndex === -1) {
      throw new Error('No valid JSON found in response');
    }
    
    const endIndex = responseText.lastIndexOf(endChar);
    if (endIndex === -1) {
      throw new Error('Incomplete JSON in response');
    }
    
    const jsonString = responseText.slice(startIndex, endIndex + 1);
    return JSON.parse(jsonString) as T;
  }

  /**
   * Validate that the API response has the expected structure
   */
  protected validateResponseStructure(response: any, requiredFields: string[]): void {
    for (const field of requiredFields) {
      if (!(field in response) || response[field] === undefined || response[field] === null) {
        throw new Error(`Missing required field in response: ${field}`);
      }
    }
  }

  /**
   * Retry operation with exponential backoff
   */
  protected async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === maxRetries) {
          break;
        }
        
        const delay = baseDelay * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError!;
  }

  /**
   * Get service name
   */
  public getServiceName(): string {
    return this.serviceName;
  }

  /**
   * Get current configuration
   */
  public getConfig(): AIConfig {
    return { ...this.defaultConfig };
  }

  /**
   * Update configuration
   */
  public updateConfig(config: Partial<AIConfig>): void {
    this.defaultConfig = { ...this.defaultConfig, ...config };
  }
}