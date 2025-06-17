import { BaseAIService } from './BaseAIService';

export type FeedbackType = 'success' | 'warning' | 'suggestion';

export interface FeedbackItem {
  type: FeedbackType;
  text: string;
}

const FEEDBACK_MODEL = 'gemini-2.0-flash-lite';
const REQUIRED_FEEDBACK_FIELDS = ['type', 'text'];

export class InterviewFeedbackService extends BaseAIService {
  constructor(apiKey?: string) {
    super('InterviewFeedbackService', apiKey);
  }

  async generateFeedback(question: string, response: string): Promise<FeedbackItem[]> {
    if (!question.trim() || !response.trim()) {
      throw new Error('Question and response are required');
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
    return `Analyze this interview response and provide feedback in the following format:
    - Success: What was done well
    - Warning: What needs improvement
    - Suggestion: How to improve

    Question: ${question}
    Response: ${response}

        Provide 1 specific point for each category. Each point should be concise and no longer than 2 sentences. Format each point as a JSON object with 'type' ('success', 'warning', or 'suggestion') and 'text' (the feedback message).`;
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
}