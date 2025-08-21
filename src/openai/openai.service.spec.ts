import { Test } from '@nestjs/testing';
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

jest.mock('openai', () => jest.fn(() => mockOpenAI));

describe('OpenaiService', () => {
  let service: OpenaiService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        OpenaiService,
        {
          provide: ConfigService,
          useValue: { get: () => 'test-api-key' },
        },
      ],
    }).compile();

    service = module.get(OpenaiService);
    jest.clearAllMocks();
  });

  it('generates AI response', async () => {
    const mockResponse = {
      choices: [{ message: { content: 'Hello there!' } }],
    };
    mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse);

    const result = await service.generateResponse('Hello');

    expect(result).toBe('Hello there!');
  });

  it('returns empty string when no content', async () => {
    const mockResponse = {
      choices: [{ message: { content: null } }],
    };
    mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse);

    const result = await service.generateResponse('Hello');

    expect(result).toBe('');
  });

  it('throws error when API fails', async () => {
    mockOpenAI.chat.completions.create.mockRejectedValue(new Error('API Error'));

    await expect(service.generateResponse('Hello')).rejects.toThrow('Failed to generate response');
  });
});