/**
 * AI service for generating interview questions based on position and interview type
 * Uses Google Gemini AI to create personalized questions
 */

import { BaseAIService } from './BaseAIService';
import { InterviewQuestion } from '../data/interviewQuestions';
import { InterviewType } from '../types/interview';

export class QuestionGenerator extends BaseAIService {
  private readonly model = 'gemini-2.0-flash-lite';

  constructor() {
    super('QuestionGenerator');
  }

  /**
   * Generate interview questions based on position and interview type
   */
  async generateQuestions(
    position: string,
    interviewType: InterviewType,
    questionCount: number = 3
  ): Promise<InterviewQuestion[]> {
    try {
      const prompt = this.buildPrompt(position, interviewType, questionCount);
      
      return await this.withRetry(async () => {
        const response = await this.generateContent({
          model: this.model,
          prompt,
          config: { temperature: 0.8 } // Slightly higher creativity for diverse questions
        });

        return this.parseQuestions(response);
      });
    } catch (error) {
      console.error('QuestionGenerator: Failed to generate questions:', error);
      throw error;
    }
  }

  /**
   * Build the AI prompt for question generation
   */
  private buildPrompt(position: string, interviewType: InterviewType, questionCount: number): string {
    const basePrompt = `Generate ${questionCount} interview questions for a ${position} position.`;
    
    let interviewTypeInstructions = '';
    switch (interviewType) {
      case 'behavioral':
        interviewTypeInstructions = `
        Focus on behavioral questions that explore:
        - Past experiences and accomplishments
        - Problem-solving situations
        - Leadership and teamwork scenarios
        - Handling challenges and failures
        - Communication and interpersonal skills
        - Decision-making processes
        
        Use STAR method compatible questions (Situation, Task, Action, Result).`;
        break;
        
      case 'technical':
        interviewTypeInstructions = `
        Focus on technical questions that assess:
        - Core technical knowledge for ${position}
        - Problem-solving and analytical thinking
        - System design and architecture understanding
        - Best practices and industry standards
        - Technical challenges and debugging skills
        - Tool and technology proficiency
        
        Include both conceptual and practical questions.`;
        break;
        
      case 'mixed':
        interviewTypeInstructions = `
        Create a balanced mix of behavioral and technical questions:
        - 50% behavioral questions focusing on experiences and soft skills
        - 50% technical questions assessing domain expertise
        - Ensure questions complement each other
        - Progress from easier to more challenging topics`;
        break;
    }

    return `${basePrompt}

${interviewTypeInstructions}

Requirements:
- Questions should be specific to the ${position} role
- Vary difficulty levels: 1 Easy, 1 Medium, 1 Hard (for 3 questions)
- Each question should be clear, professional, and interview-appropriate
- Provide 2-3 helpful tips for each question to guide the candidate
- Questions should allow for detailed, meaningful responses
- Avoid yes/no questions or overly broad topics

Return the response as a JSON array with this exact structure:
[
  {
    "id": "unique_id_1",
    "question": "The interview question text",
    "category": "Question category (e.g., 'Experience', 'Technical Skills', 'Problem Solving')",
    "difficulty": "Easy|Medium|Hard",
    "tips": ["Tip 1", "Tip 2", "Tip 3"]
  }
]

Ensure all questions are relevant, professional, and appropriate for a ${position} interview.`;
  }

  /**
   * Parse AI response into InterviewQuestion array
   */
  private parseQuestions(response: string): InterviewQuestion[] {
    try {
      const questions = this.parseJSONOptimized<InterviewQuestion[]>(response);
      
      // Validate each question has required fields
      questions.forEach((question, index) => {
        this.validateResponseStructure(question as unknown as Record<string, unknown>, [
          'id', 'question', 'category', 'difficulty', 'tips'
        ]);
        
        // Ensure tips is an array
        if (!Array.isArray(question.tips)) {
          throw new Error(`Question ${index + 1}: tips must be an array`);
        }
        
        // Validate difficulty value
        if (!['Easy', 'Medium', 'Hard'].includes(question.difficulty)) {
          throw new Error(`Question ${index + 1}: invalid difficulty level`);
        }
        
        // Ensure question text is not empty
        if (!question.question.trim()) {
          throw new Error(`Question ${index + 1}: question text cannot be empty`);
        }
      });
      
      return questions;
    } catch (error) {
      console.error('QuestionGenerator: Failed to parse questions:', error);
      throw new Error('Failed to parse generated questions');
    }
  }
}