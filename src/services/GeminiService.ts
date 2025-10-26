import axios, { AxiosInstance } from 'axios';

export interface GeminiResponse {
  text: string;
  confidence: number;
}

export interface ProblemAnalysis {
  solution: string;
  steps: string[];
  difficulty: 'easy' | 'medium' | 'hard';
}

export class GeminiService {
  private api: AxiosInstance;
  private apiKey: string;

  constructor(apiKey: string = '') {
    this.apiKey = apiKey;
    this.api = axios.create({
      baseURL: 'https://generativelanguage.googleapis.com/v1beta',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  async analyzeProblem(imageData: string): Promise<ProblemAnalysis> {
    try {
      const response = await this.api.post(
        `/models/gemini-pro-vision:generateContent?key=${this.apiKey}`,
        {
          contents: [
            {
              parts: [
                { text: 'Analyze this math problem and provide a solution' },
                { inline_data: { mime_type: 'image/jpeg', data: imageData } },
              ],
            },
          ],
        }
      );

      const text = response.data.candidates[0]?.content?.parts[0]?.text || '';
      
      return this.parseSolution(text);
    } catch (error) {
      throw new Error(`Failed to analyze problem: ${error.message}`);
    }
  }

  async generateQuiz(topic: string, count: number = 5): Promise<any[]> {
    try {
      const response = await this.api.post(
        `/models/gemini-pro:generateContent?key=${this.apiKey}`,
        {
          contents: [
            {
              parts: [
                {
                  text: `Generate ${count} quiz questions about ${topic}`,
                },
              ],
            },
          ],
        }
      );

      const text = response.data.candidates[0]?.content?.parts[0]?.text || '';
      return this.parseQuizQuestions(text, count);
    } catch (error) {
      throw new Error(`Failed to generate quiz: ${error.message}`);
    }
  }

  async chat(message: string, conversationHistory: any[] = []): Promise<GeminiResponse> {
    try {
      const response = await this.api.post(
        `/models/gemini-pro:generateContent?key=${this.apiKey}`,
        {
          contents: [
            ...conversationHistory,
            {
              parts: [{ text: message }],
            },
          ],
        }
      );

      const text = response.data.candidates[0]?.content?.parts[0]?.text || '';
      const confidence = response.data.candidates[0]?.finishReason === 'STOP' ? 0.9 : 0.5;

      return { text, confidence };
    } catch (error) {
      throw new Error(`Chat failed: ${error.message}`);
    }
  }

  private parseSolution(text: string): ProblemAnalysis {
    const lines = text.split('\n').filter(line => line.trim());
    const steps = lines.slice(1, -1);
    
    return {
      solution: lines[lines.length - 1] || text,
      steps,
      difficulty: this.estimateDifficulty(steps.length),
    };
  }

  private estimateDifficulty(stepsCount: number): 'easy' | 'medium' | 'hard' {
    if (stepsCount <= 3) return 'easy';
    if (stepsCount <= 6) return 'medium';
    return 'hard';
  }

  private parseQuizQuestions(text: string, count: number): any[] {
    const questions = [];
    const lines = text.split('\n');
    
    for (let i = 0; i < Math.min(count, lines.length); i++) {
      if (lines[i].trim()) {
        questions.push({
          id: `q${i + 1}`,
          question: lines[i].trim(),
          answer: '',
        });
      }
    }

    return questions;
  }

  setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
  }

  isConfigured(): boolean {
    return this.apiKey.length > 0;
  }
}

export default new GeminiService();
