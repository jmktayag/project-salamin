import { GoogleGenAI } from '@google/genai';

export type FeedbackType = 'success' | 'warning' | 'suggestion';

export interface FeedbackItem {
  type: FeedbackType;
  text: string;
}

export class FeedbackGenerator {
  private ai: GoogleGenAI;
  private config = {
    temperature: 0.7,
    topK: 40,
    topP: 0.95,
  };

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('Gemini API key is required');
    }
    this.ai = new GoogleGenAI({ apiKey });
  }

  async generateFeedback(question: string, response: string): Promise<FeedbackItem[]> {
    const model = 'gemini-2.0-flash-lite';
    const prompt = `Analyze this interview response and provide feedback in the following format:
    - Success: What was done well
    - Warning: What needs improvement
    - Suggestion: How to improve

    Question: ${question}
    Response: ${response}

    Provide 1 specific point for each category. Each point should be concise and no longer than 2 sentences. Format each point as a JSON object with 'type' ('success', 'warning', or 'suggestion') and 'text' (the feedback message).`;

    const result = await this.ai.models.generateContent({
      model,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: this.config,
    });

    if (!result.candidates?.[0]?.content?.parts?.[0]?.text) {
      throw new Error('No valid response from AI');
    }

    const responseText = result.candidates[0].content.parts[0].text;
    try {
      // Extract JSON array from the response
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in response');
      }
      const feedback = JSON.parse(jsonMatch[0]) as FeedbackItem[];
      return feedback;
    } catch (error) {
      console.error('Error parsing feedback:', error);
      return [
        {
          type: 'warning',
          text: 'Unable to generate feedback. Please try again.',
        },
      ];
    }
  }
} 