import axios, { AxiosInstance } from "axios";
import CacheManager from "../utils/CacheManager";
import PerformanceMonitor from "../utils/PerformanceMonitor";
import { ExplanationMode, ExplanationDepth, ExplanationTone } from "../types";

export interface GeminiResponse {
  text: string;
  confidence: number;
}

export interface ProblemAnalysis {
  solution: string;
  steps: string[];
  difficulty: "easy" | "medium" | "hard";
  problem?: string;
  resources?: Array<{
    title: string;
    type: string;
    url: string;
    summary: string;
    citation?: string;
  }>;
}

export interface ExplanationOptions {
  mode?: ExplanationMode;
  depth?: ExplanationDepth;
  tone?: ExplanationTone;
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

  private buildModePrompt(options?: ExplanationOptions): string {
    const mode = options?.mode || "standard";
    const depth = options?.depth || "normal";
    const tone = options?.tone || "formal";

    let modeInstruction = "";
    
    switch (mode) {
      case "eli5":
        modeInstruction = "Explain this like I'm 5 years old. Use simple words, everyday examples, and avoid technical jargon. Make it fun and easy to understand for a child.";
        break;
      case "advanced":
        modeInstruction = "Provide an advanced, in-depth explanation with technical details, mathematical rigor, and theoretical background. Assume the reader has strong foundational knowledge.";
        break;
      case "standard":
      default:
        modeInstruction = "Provide a clear, balanced explanation suitable for a typical student. Include key concepts without overwhelming detail.";
        break;
    }

    let depthInstruction = "";
    switch (depth) {
      case "brief":
        depthInstruction = " Keep it concise and to the point.";
        break;
      case "detailed":
        depthInstruction = " Provide comprehensive details and thorough explanations.";
        break;
      case "normal":
      default:
        depthInstruction = " Use a moderate level of detail.";
        break;
    }

    let toneInstruction = "";
    switch (tone) {
      case "casual":
        toneInstruction = " Use a friendly, conversational tone.";
        break;
      case "technical":
        toneInstruction = " Use precise, technical language.";
        break;
      case "formal":
      default:
        toneInstruction = " Use a professional, educational tone.";
        break;
    }

    if (__DEV__) {
      console.log("[GeminiService] Prompt Instructions:", {
        mode,
        depth,
        tone,
        fullInstruction: modeInstruction + depthInstruction + toneInstruction
      });
    }

    return modeInstruction + depthInstruction + toneInstruction;
  }

  async analyzeProblem(imageData: string, options?: ExplanationOptions): Promise<ProblemAnalysis> {
    const mode = options?.mode || "standard";
    const depth = options?.depth || "normal";
    const tone = options?.tone || "formal";
    
    const cacheKey = CacheManager.getCacheKey(
      "problem",
      imageData.slice(0, 50),
      mode,
      depth,
      tone
    );

    return PerformanceMonitor.measureAsync("api_analyze_problem", async () => {
      return CacheManager.getOrFetch(
        cacheKey,
        async () => {
          try {
            const modePrompt = this.buildModePrompt(options);
            const basePrompt = `Analyze this math problem and provide a solution. ${modePrompt} Also, suggest 3-5 relevant learning resources (textbooks, videos, websites) with citations that would help understand this topic better. Format your response as:

SOLUTION:
[solution steps]

FINAL ANSWER:
[answer]

RESOURCES:
1. [Type: textbook/video/website] [Title] - [Brief summary] - [URL or Citation]
2. ...`;

            if (__DEV__) {
              console.log("[GeminiService] analyzeProblem payload:", {
                mode,
                depth,
                tone,
                promptLength: basePrompt.length
              });
            }

            const response = await this.api.post(
              `/models/gemini-pro-vision:generateContent?key=${this.apiKey}`,
              {
                contents: [
                  {
                    parts: [
                      {
                        text: basePrompt,
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
        { ttl: 30 * 60 * 1000 }
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

  async summarizeText(text: string, maxLength?: number): Promise<string> {
    return PerformanceMonitor.measureAsync("api_summarize_text", async () => {
      try {
        const prompt = maxLength
          ? `Summarize the following text in no more than ${maxLength} words:\n\n${text}`
          : `Provide a concise summary of the following text:\n\n${text}`;

        const response = await this.api.post(
          `/models/gemini-pro:generateContent?key=${this.apiKey}`,
          {
            contents: [
              {
                parts: [
                  {
                    text: prompt,
                  },
                ],
              },
            ],
          }
        );

        return response.data.candidates[0]?.content?.parts[0]?.text || "";
      } catch (error) {
        throw new Error(
          `Failed to summarize text: ${(error as Error).message}`
        );
      }
    });
  }

  async generateQuestionsFromText(
    text: string,
    count: number = 5
  ): Promise<any[]> {
    return PerformanceMonitor.measureAsync(
      "api_generate_questions_from_text",
      async () => {
        try {
          const response = await this.api.post(
            `/models/gemini-pro:generateContent?key=${this.apiKey}`,
            {
              contents: [
                {
                  parts: [
                    {
                      text: `Generate ${count} quiz questions based on the following text. Include the answer for each question:\n\n${text}`,
                    },
                  ],
                },
              ],
            }
          );

          const responseText =
            response.data.candidates[0]?.content?.parts[0]?.text || "";
          return this.parseQuizQuestions(responseText, count);
        } catch (error) {
          throw new Error(
            `Failed to generate questions: ${(error as Error).message}`
          );
        }
      }
    );
  }

  async chat(
    message: string,
    conversationHistory: any[] = [],
    options?: ExplanationOptions
  ): Promise<GeminiResponse> {
    return PerformanceMonitor.measureAsync(
      "api_chat",
      async () => {
        try {
          const modePrompt = options ? this.buildModePrompt(options) : "";
          const enhancedMessage = modePrompt 
            ? `${modePrompt}\n\nUser question: ${message}`
            : message;

          if (__DEV__) {
            console.log("[GeminiService] chat payload:", {
              mode: options?.mode || "standard",
              depth: options?.depth || "normal",
              tone: options?.tone || "formal",
              originalMessageLength: message.length,
              enhancedMessageLength: enhancedMessage.length
            });
          }

          const response = await this.api.post(
            `/models/gemini-pro:generateContent?key=${this.apiKey}`,
            {
              contents: [
                ...conversationHistory,
                {
                  parts: [{ text: enhancedMessage }],
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
    
    const resourcesIndex = lines.findIndex(line => 
      line.toUpperCase().includes("RESOURCES:")
    );
    
    const solutionLines = resourcesIndex > 0 ? lines.slice(0, resourcesIndex) : lines;
    const finalAnswerIndex = solutionLines.findIndex(line => 
      line.toUpperCase().includes("FINAL ANSWER:")
    );
    
    const steps = finalAnswerIndex > 0 
      ? solutionLines.slice(1, finalAnswerIndex)
      : solutionLines.slice(1, -1);
    
    const solution = finalAnswerIndex > 0 && finalAnswerIndex < solutionLines.length - 1
      ? solutionLines.slice(finalAnswerIndex + 1).join(" ").trim()
      : (solutionLines[solutionLines.length - 1] || text);

    const resources = resourcesIndex > 0 
      ? this.parseResources(lines.slice(resourcesIndex + 1))
      : [];

    return {
      solution,
      steps,
      difficulty: this.estimateDifficulty(steps.length),
      resources,
    };
  }

  private parseResources(resourceLines: string[]): Array<{
    title: string;
    type: string;
    url: string;
    summary: string;
    citation?: string;
  }> {
    const resources = [];
    
    for (const line of resourceLines) {
      const match = line.match(/\[Type:\s*(\w+)\]\s*(.+?)\s*-\s*(.+?)\s*-\s*(.+)/i);
      if (match) {
        const [, type, title, summary, urlOrCitation] = match;
        resources.push({
          type: type.toLowerCase(),
          title: title.trim(),
          summary: summary.trim(),
          url: urlOrCitation.trim().startsWith("http") ? urlOrCitation.trim() : "",
          citation: !urlOrCitation.trim().startsWith("http") ? urlOrCitation.trim() : undefined,
        });
      }
    }
    
    return resources;
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
