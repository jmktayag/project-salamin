import { GoogleGenAI } from '@google/genai';

export interface InterviewAnalysis {
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  score: number;
  verdict: 'Strong Hire' | 'Hire' | 'Weak Hire' | 'No Hire';
  summary: string;
}

export class InterviewAnalyzer {
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

  async analyzeInterview(feedback: Array<{ question: string; feedback: string }>): Promise<InterviewAnalysis> {
    const model = 'gemini-2.0-flash-lite';
    const prompt = `
      Analyze the following interview feedback and provide a comprehensive assessment.
      Focus on identifying key strengths, areas for improvement, and specific suggestions.
      Calculate a final score out of 100 based on:
      - Relevance and clarity of answers (50 points)
      - Fit for the role (30 points)
      - Enthusiasm and growth potential (20 points)
      
      Provide a verdict based on the score:
      - 90-100: Strong Hire
      - 75-89: Hire
      - 60-74: Weak Hire
      - Below 60: No Hire

      Interview Feedback:
      ${feedback.map(f => `Q: ${f.question}\nA: ${f.feedback}`).join('\n\n')}

      Please provide your analysis in the following JSON format:
      {
        "strengths": string[],
        "weaknesses": string[],
        "suggestions": string[],
        "score": number,
        "verdict": "Strong Hire" | "Hire" | "Weak Hire" | "No Hire",
        "summary": string
      }
    `;

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
      // Extract JSON object from the response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in response');
      }
      const analysis = JSON.parse(jsonMatch[0]) as InterviewAnalysis;
      
      // Validate the analysis
      if (!analysis.strengths || !analysis.weaknesses || !analysis.suggestions ||
          typeof analysis.score !== 'number' || !analysis.verdict || !analysis.summary) {
        throw new Error('Invalid analysis format');
      }

      return analysis;
    } catch (error) {
      console.error('Error parsing interview analysis:', error);
      throw new Error('Failed to generate interview analysis');
    }
  }
} 