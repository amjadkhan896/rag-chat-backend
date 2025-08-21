import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { ChatMessage } from './message.entity';
import { ChatSession } from '../sessions/session.entity';
import { OpenaiService } from '../openai/openai.service';

describe('MessagesService', () => {
  let service: MessagesService;
  let mockMessagesRepo = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
  };
  let mockSessionsRepo = {
    findOne: jest.fn(),
  };
  let mockOpenaiService = {
    generateResponse: jest.fn(),
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        MessagesService,
        {
          provide: getRepositoryToken(ChatMessage),
          useValue: mockMessagesRepo,
        },
        {
          provide: getRepositoryToken(ChatSession),
          useValue: mockSessionsRepo,
        },
        {
          provide: OpenaiService,
          useValue: mockOpenaiService,
        },
      ],
    }).compile();

    service = module.get(MessagesService);
    jest.clearAllMocks();
  });

  it('creates user message successfully', async () => {
    const mockSession = { id: 'session1', userId: 'user1' };
    const mockMessage = { id: 'msg1', role: 'user', content: 'Hello' };

    mockSessionsRepo.findOne.mockResolvedValue(mockSession);
    mockMessagesRepo.create.mockReturnValue(mockMessage);
    mockMessagesRepo.save.mockResolvedValue(mockMessage);
    mockMessagesRepo.find.mockResolvedValue([]);
    mockOpenaiService.generateResponse.mockResolvedValue('AI response');

    const result = await service.createMessage('user1', 'session1', {
      role: 'user',
      content: 'Hello',
    });

    expect(result).toEqual(mockMessage);
  });

  it('throws error when session not found', async () => {
    mockSessionsRepo.findOne.mockResolvedValue(null);

    await expect(service.createMessage('user1', 'session1', {
      role: 'user',
      content: 'Hello',
    })).rejects.toThrow(NotFoundException);
  });

  it('lists messages for session', async () => {
    const mockSession = { id: 'session1', userId: 'user1' };
    const mockMessages = [
      { id: 'msg1', content: 'Hello' },
      { id: 'msg2', content: 'Hi there' },
    ];

    mockSessionsRepo.findOne.mockResolvedValue(mockSession);
    mockMessagesRepo.find.mockResolvedValue(mockMessages);

    const result = await service.listMessages('user1', 'session1');

    expect(result).toEqual(mockMessages);
  });

  it('gets chat history', async () => {
    const mockSession = { id: 'session1', userId: 'user1' };
    const mockMessages = [
      { role: 'user', content: 'Hello', createdAt: new Date() },
    ];

    mockSessionsRepo.findOne.mockResolvedValue(mockSession);
    mockMessagesRepo.find.mockResolvedValue(mockMessages);

    const result = await service.getChatHistory('user1', 'session1');

    expect(result).toHaveLength(1);
    expect(result[0]).toHaveProperty('role', 'user');
    expect(result[0]).toHaveProperty('content', 'Hello');
  });
});