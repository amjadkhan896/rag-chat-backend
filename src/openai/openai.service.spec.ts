import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { OpenaiService } from './openai.service';

// Mock OpenAI
const mockOpenAI = {
  chat: {
    completions: {
      create: jest.fn(),
    },
  },
};

jest.mock('openai', () => {
  return {
    OpenAI: jest.fn(() => mockOpenAI),
  };
});

describe('OpenaiService', () => {
  let service: OpenaiService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OpenaiService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('test-api-key'),
          },
        },
      ],
    }).compile();

    service = module.get<OpenaiService>(OpenaiService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateResponse', () => {
    it('should generate a response successfully', async () => {
      const prompt = 'Hello, how are you?';
      const expectedResponse = 'I am doing well, thank you!';

      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [
          {
            message: {
              content: expectedResponse,
            },
          },
        ],
      });

      const result = await service.generateResponse(prompt);

      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledWith({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 1000,
        temperature: 0.7,
      });
      expect(result).toBe(expectedResponse);
    });

    it('should handle empty response content', async () => {
      const prompt = 'Hello, how are you?';

      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [
          {
            message: {
              content: '',
            },
          },
        ],
      });

      const result = await service.generateResponse(prompt);

      expect(result).toBe('I apologize, but I couldn\'t generate a response. Please try again.');
    });

    it('should handle null response content', async () => {
      const prompt = 'Hello, how are you?';

      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [
          {
            message: {
              content: null,
            },
          },
        ],
      });

      const result = await service.generateResponse(prompt);

      expect(result).toBe('I apologize, but I couldn\'t generate a response. Please try again.');
    });

    it('should handle missing choices', async () => {
      const prompt = 'Hello, how are you?';

      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [],
      });

      const result = await service.generateResponse(prompt);

      expect(result).toBe('I apologize, but I couldn\'t generate a response. Please try again.');
    });

    it('should handle OpenAI API errors', async () => {
      const prompt = 'Hello, how are you?';

      mockOpenAI.chat.completions.create.mockRejectedValue(new Error('API Error'));

      await expect(service.generateResponse(prompt)).rejects.toThrow('API Error');
    });

    it('should use correct model and parameters', async () => {
      const prompt = 'Test prompt';

      mockOpenAI.chat.completions.create.mockResolvedValue({
        choices: [
          {
            message: {
              content: 'Test response',
            },
          },
        ],
      });

      await service.generateResponse(prompt);

      expect(mockOpenAI.chat.completions.create).toHaveBeenCalledWith({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 1000,
        temperature: 0.7,
      });
    });
  });

  describe('initialization', () => {
    it('should initialize with API key from config', () => {
      expect(configService.get).toHaveBeenCalledWith('OPENAI_API_KEY');
    });
  });
});
