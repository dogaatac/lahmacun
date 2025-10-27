import axios, { AxiosInstance } from "axios";
import CacheManager from "../utils/CacheManager";
import PerformanceMonitor from "../utils/PerformanceMonitor";

export interface GeminiResponse {
  text: string;
  confidence: number;
}

export interface ProblemAnalysis {
  solution: string;
  steps: string[];
  difficulty: "easy" | "medium" | "hard";
}

export class GeminiService {
  private api: AxiosInstance;
  private apiKey: string;

  constructor(apiKey: string = "") {
    this.apiKey = apiKey;
    this.api = axios.create({
      baseURL: "https://generativelanguage.googleapis.com/v1beta",
      timeout: 30000,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  async analyzeProblem(imageData: string): Promise<ProblemAnalysis> {
    const cacheKey = CacheManager.getCacheKey(
      "problem",
      imageData.slice(0, 50)

    return PerformanceMonitor.measureAsync("api_analyze_problem", async () => {
      return CacheManager.getOrFetch(
        cacheKey,
        async () => {
          try {
            const response = await this.api.post(
              `/models/gemini-pro-vision:generateContent?key=${this.apiKey}`,
              {
                contents: [
                  {
                    parts: [
                      {
                        text: "Analyze this math problem and provide a solution",
                      },
                      {
                        inline_data: {
                          mime_type: "image/jpeg",
                          data: imageData,
                        },
                      },
                    ],
                  },
                ],
              }
            );

            const text =
              response.data.candidates[0]?.content?.parts[0]?.text || "";

            return this.parseSolution(text);
          } catch (error) {
            throw new Error(
              `Failed to analyze problem: ${(error as Error).message}`
            );
          }
        },
        { ttl: 30 * 60 * 1000 } // Cache for 30 minutes
      );
    });
  }

  async generateQuiz(topic: string, count: number = 5): Promise<any[]> {
    const cacheKey = CacheManager.getCacheKey("quiz", topic, count);

    return PerformanceMonitor.measureAsync("api_generate_quiz", async () => {
      return CacheManager.getOrFetch(
        cacheKey,
        async () => {
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

            const text =
              response.data.candidates[0]?.content?.parts[0]?.text || "";
            return this.parseQuizQuestions(text, count);
          } catch (error) {
            throw new Error(
              `Failed to generate quiz: ${(error as Error).message}`
            );
          }
        },
        { ttl: 60 * 60 * 1000 } // Cache for 1 hour
      );
    });
  }

  async chat(
    message: string,
    conversationHistory: any[] = []
  ): Promise<GeminiResponse> {
    return PerformanceMonitor.measureAsync(
      "api_chat",
      async () => {
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

          const text =
            response.data.candidates[0]?.content?.parts[0]?.text || "";
          const confidence =
            response.data.candidates[0]?.finishReason === "STOP" ? 0.9 : 0.5;

          return { text, confidence };
        } catch (error) {
          throw new Error(`Chat failed: ${(error as Error).message}`);
        }
      },
      { messageLength: message.length }
    );
  }

  private parseSolution(text: string): ProblemAnalysis {
    const lines = text.split("\n").filter((line) => line.trim());
    const steps = lines.slice(1, -1);

    return {
      solution: lines[lines.length - 1] || text,
      steps,
      difficulty: this.estimateDifficulty(steps.length),
    };
  }

  private estimateDifficulty(stepsCount: number): "easy" | "medium" | "hard" {
    if (stepsCount <= 3) {return 'easy';}
    if (stepsCount <= 6) {return 'medium';}
    return "hard";
  }

  private parseQuizQuestions(text: string, count: number): any[] {
    const questions = [];
    const lines = text.split("\n");

    for (let i = 0; i < Math.min(count, lines.length); i++) {
      if (lines[i].trim()) {
        questions.push({
          id: `q${i + 1}`,
          question: lines[i].trim(),
          answer: "",
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
