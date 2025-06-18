import { BaseAIService } from './BaseAIService';

export type FeedbackType = 'success' | 'warning' | 'suggestion';

export interface FeedbackItem {
  type: FeedbackType;
  text: string;
}

const FEEDBACK_MODEL = 'gemini-2.0-flash-lite';
const REQUIRED_FEEDBACK_FIELDS = ['type', 'text'];

// Response quality validation constants
const MIN_MEANINGFUL_WORDS = 3;
const MIN_RESPONSE_LENGTH = 10;
const MAX_REPETITION_RATIO = 0.6;

export class InterviewFeedbackService extends BaseAIService {
  constructor(apiKey?: string) {
    super('InterviewFeedbackService', apiKey);
  }

  async generateFeedback(question: string, response: string): Promise<FeedbackItem[]> {
    if (!question.trim() || !response.trim()) {
      throw new Error('Question and response are required');
    }

    // Check response quality before AI analysis
    const lowQualityFeedback = this.getLowQualityFeedback(response);
    if (lowQualityFeedback.length > 0) {
      return lowQualityFeedback;
    }

    const prompt = this.buildFeedbackPrompt(question, response);

    try {
      return await this.withRetry(async () => {
        const responseText = await this.generateContent({
          model: FEEDBACK_MODEL,
          prompt
        });

        const feedback = this.parseJSONOptimized<FeedbackItem[]>(responseText);
        this.validateFeedbackItems(feedback);
        return feedback;
      });
    } catch (error) {
      // Return fallback feedback instead of throwing
      return this.getFallbackFeedback();
    }
  }

  private buildFeedbackPrompt(question: string, response: string): string {
    return `You are an experienced interviewer evaluating a candidate's response. Be critical and honest in your assessment. Only provide positive feedback when truly warranted.

    Analyze this interview response and provide feedback in the following format:
    - Success: What was genuinely done well (only if the response demonstrates real value)
    - Warning: What needs improvement or is concerning
    - Suggestion: Specific, actionable advice for improvement

    Question: ${question}
    Response: ${response}

    IMPORTANT: Be strict in your evaluation. If the response is poor, vague, or shows lack of preparation, do not provide false positives. Focus on constructive criticism. Provide 1-3 specific points total. Each point should be concise and no longer than 2 sentences. Format each point as a JSON object with 'type' ('success', 'warning', or 'suggestion') and 'text' (the feedback message).`;
  }

  private validateFeedbackItems(feedback: FeedbackItem[]): void {
    if (!Array.isArray(feedback)) {
      throw new Error('Feedback must be an array');
    }

    if (feedback.length === 0) {
      throw new Error('Feedback array cannot be empty');
    }

    for (const item of feedback) {
      this.validateResponseStructure(item as unknown as Record<string, unknown>, REQUIRED_FEEDBACK_FIELDS);
      
      if (!['success', 'warning', 'suggestion'].includes(item.type)) {
        throw new Error(`Invalid feedback type: ${item.type}`);
      }
      
      if (typeof item.text !== 'string' || item.text.trim().length === 0) {
        throw new Error('Feedback text must be a non-empty string');
      }
    }
  }

  private getFallbackFeedback(): FeedbackItem[] {
    return [
      {
        type: 'warning',
        text: 'Unable to generate AI feedback at this time. Please try again later.'
      }
    ];
  }

  /**
   * Check if the response is too short to be meaningful
   */
  private isResponseTooShort(response: string): boolean {
    return response.trim().length < MIN_RESPONSE_LENGTH;
  }

  /**
   * Check if the response consists of nonsensical patterns
   */
  private isResponseNonsensical(response: string): boolean {
    const trimmed = response.trim().toLowerCase();
    
    // Check for random character patterns (e.g., "abcdefghijklmnop")
    const hasSequentialChars = /^[a-z]{8,}$/.test(trimmed) && this.isSequentialChars(trimmed);
    
    // Check for repeated single characters or patterns
    const hasRepeatedChars = /^(.)\1{4,}$/.test(trimmed) || /^(.{1,3})\1{3,}$/.test(trimmed);
    
    // Check for keyboard mashing patterns
    const hasKeyboardMashing = /^[qwertyuiopasdfghjklzxcvbnm]{8,}$/.test(trimmed) && 
                               this.isKeyboardMashing(trimmed);
    
    return hasSequentialChars || hasRepeatedChars || hasKeyboardMashing;
  }

  /**
   * Check if the response is meaningful (has enough content and structure)
   */
  private isResponseMeaningful(response: string): boolean {
    const trimmed = response.trim();
    
    // Count words (split by whitespace and filter out empty strings)
    const words = trimmed.split(/\s+/).filter(word => word.length > 0);
    const wordCount = words.length;
    
    // Check if it has enough words
    if (wordCount < MIN_MEANINGFUL_WORDS) {
      return false;
    }
    
    // Check for excessive repetition
    const uniqueWords = new Set(words.map(word => word.toLowerCase()));
    const repetitionRatio = 1 - (uniqueWords.size / wordCount);
    
    if (repetitionRatio > MAX_REPETITION_RATIO) {
      return false;
    }
    
    return true;
  }

  /**
   * Check if string contains sequential characters (e.g., "abcdefg")
   */
  private isSequentialChars(text: string): boolean {
    if (text.length < 4) return false;
    
    let sequentialCount = 1;
    for (let i = 1; i < text.length; i++) {
      if (text.charCodeAt(i) === text.charCodeAt(i - 1) + 1) {
        sequentialCount++;
        if (sequentialCount >= 4) return true;
      } else {
        sequentialCount = 1;
      }
    }
    return false;
  }

  /**
   * Check if string looks like keyboard mashing
   */
  private isKeyboardMashing(text: string): boolean {
    // Common keyboard mashing patterns
    const mashingPatterns = [
      /asdf/g, /qwer/g, /zxcv/g, /hjkl/g, /uiop/g,
      /fdsa/g, /rewq/g, /vcxz/g, /lkjh/g, /poiu/g
    ];
    
    let matchCount = 0;
    for (const pattern of mashingPatterns) {
      const matches = text.match(pattern);
      if (matches) {
        matchCount += matches.length;
      }
    }
    
    // If more than 30% of the text matches mashing patterns
    return matchCount * 4 > text.length * 0.3;
  }

  /**
   * Get feedback for low-quality responses
   */
  private getLowQualityFeedback(response: string): FeedbackItem[] {
    if (this.isResponseTooShort(response)) {
      return [
        {
          type: 'warning',
          text: 'Your response is too brief. Please provide a more detailed answer that demonstrates your knowledge and experience.'
        },
        {
          type: 'suggestion',
          text: 'Try to elaborate on your answer with specific examples, relevant experiences, or detailed explanations.'
        }
      ];
    }
    
    if (this.isResponseNonsensical(response)) {
      return [
        {
          type: 'warning',
          text: 'Your response appears to contain random text or characters. Please provide a meaningful answer to the interview question.'
        },
        {
          type: 'suggestion',
          text: 'Take time to understand the question and provide a thoughtful, relevant response that showcases your skills and experience.'
        }
      ];
    }
    
    if (!this.isResponseMeaningful(response)) {
      return [
        {
          type: 'warning',
          text: 'Your response lacks sufficient detail and substance. Interview answers should be comprehensive and demonstrate your qualifications.'
        },
        {
          type: 'suggestion',
          text: 'Expand your answer with specific examples, relevant experiences, and clear explanations that directly address the question.'
        }
      ];
    }
    
    return [];
  }
}