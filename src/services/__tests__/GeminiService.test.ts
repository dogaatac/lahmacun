import axios from 'axios';
import { GeminiService } from '../GeminiService';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('GeminiService', () => {
  let service: GeminiService;
  const mockApiKey = 'test-api-key-123';

  beforeEach(() => {
    service = new GeminiService(mockApiKey);
    jest.clearAllMocks();
  });

  describe('analyzeProblem', () => {
    it('should analyze a problem and return parsed solution', async () => {
      const mockResponse = {
        data: {
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: 'Step 1: Identify the problem\nStep 2: Apply formula\nStep 3: Calculate\nAnswer: 42',
                  },
                ],
              },
              finishReason: 'STOP',
            },
          ],
        },
      };

      mockedAxios.create.mockReturnValue({
        post: jest.fn().mockResolvedValue(mockResponse),
      } as any);

      service = new GeminiService(mockApiKey);
      const result = await service.analyzeProblem('base64ImageData');

      expect(result).toHaveProperty('solution');
      expect(result).toHaveProperty('steps');
      expect(result).toHaveProperty('difficulty');
      expect(result.steps.length).toBeGreaterThan(0);
    });

    it('should handle API errors gracefully', async () => {
      mockedAxios.create.mockReturnValue({
        post: jest.fn().mockRejectedValue(new Error('Network error')),
      } as any);

      service = new GeminiService(mockApiKey);

      await expect(service.analyzeProblem('imageData')).rejects.toThrow(
        'Failed to analyze problem'
      );
    });

    it('should estimate difficulty based on step count', async () => {
      const mockResponse = {
        data: {
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: 'Step 1\nStep 2\nAnswer: 10',
                  },
                ],
              },
            },
          ],
        },
      };

      mockedAxios.create.mockReturnValue({
        post: jest.fn().mockResolvedValue(mockResponse),
      } as any);

      service = new GeminiService(mockApiKey);
      const result = await service.analyzeProblem('imageData');

      expect(['easy', 'medium', 'hard']).toContain(result.difficulty);
    });
  });

  describe('generateQuiz', () => {
    it('should generate quiz questions', async () => {
      const mockResponse = {
        data: {
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: 'Q1: What is 2+2?\nQ2: What is 3+3?\nQ3: What is 4+4?',
                  },
                ],
              },
            },
          ],
        },
      };

      mockedAxios.create.mockReturnValue({
        post: jest.fn().mockResolvedValue(mockResponse),
      } as any);

      service = new GeminiService(mockApiKey);
      const result = await service.generateQuiz('Math', 3);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      result.forEach(q => {
        expect(q).toHaveProperty('id');
        expect(q).toHaveProperty('question');
      });
    });

    it('should handle quiz generation errors', async () => {
      mockedAxios.create.mockReturnValue({
        post: jest.fn().mockRejectedValue(new Error('API error')),
      } as any);

      service = new GeminiService(mockApiKey);

      await expect(service.generateQuiz('Math')).rejects.toThrow(
        'Failed to generate quiz'
      );
    });
  });

  describe('chat', () => {
    it('should send chat message and return response', async () => {
      const mockResponse = {
        data: {
          candidates: [
            {
              content: {
                parts: [{ text: 'Hello! How can I help you?' }],
              },
              finishReason: 'STOP',
            },
          ],
        },
      };

      mockedAxios.create.mockReturnValue({
        post: jest.fn().mockResolvedValue(mockResponse),
      } as any);

      service = new GeminiService(mockApiKey);
      const result = await service.chat('Hello');

      expect(result).toHaveProperty('text');
      expect(result).toHaveProperty('confidence');
      expect(result.text).toBe('Hello! How can I help you?');
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should include conversation history', async () => {
      const mockPost = jest.fn().mockResolvedValue({
        data: {
          candidates: [
            {
              content: { parts: [{ text: 'Response' }] },
              finishReason: 'STOP',
            },
          ],
        },
      });

      mockedAxios.create.mockReturnValue({ post: mockPost } as any);

      service = new GeminiService(mockApiKey);
      const history = [{ parts: [{ text: 'Previous message' }] }];
      await service.chat('New message', history);

      expect(mockPost).toHaveBeenCalled();
    });
  });

  describe('configuration', () => {
    it('should set and verify API key', () => {
      const newService = new GeminiService();
      expect(newService.isConfigured()).toBe(false);

      newService.setApiKey('new-key');
      expect(newService.isConfigured()).toBe(true);
    });

    it('should be configured with constructor API key', () => {
      const configuredService = new GeminiService('my-key');
      expect(configuredService.isConfigured()).toBe(true);
    });
  });
});
