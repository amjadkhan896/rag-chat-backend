import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { ChatMessage } from './message.entity';
import { ChatSession } from '../sessions/session.entity';
import { OpenaiService } from '../openai/openai.service';
import { CreateMessageDto } from './dto/create-message.dto';

describe('MessagesService', () => {
  let service: MessagesService;
  let messagesRepository: jest.Mocked<Repository<ChatMessage>>;
  let sessionsRepository: jest.Mocked<Repository<ChatSession>>;
  let openaiService: jest.Mocked<OpenaiService>;

  const mockMessagesRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
  };

  const mockSessionsRepository = {
    findOne: jest.fn(),
  };

  const mockOpenaiService = {
    generateResponse: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessagesService,
        {
          provide: getRepositoryToken(ChatMessage),
          useValue: mockMessagesRepository,
        },
        {
          provide: getRepositoryToken(ChatSession),
          useValue: mockSessionsRepository,
        },
        {
          provide: OpenaiService,
          useValue: mockOpenaiService,
        },
      ],
    }).compile();

    service = module.get<MessagesService>(MessagesService);
    messagesRepository = module.get(getRepositoryToken(ChatMessage));
    sessionsRepository = module.get(getRepositoryToken(ChatSession));
    openaiService = module.get(OpenaiService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('assertOwnedSession', () => {
    it('should pass when session exists and user owns it', async () => {
      const userId = 'user123';
      const sessionId = 'session123';
      const mockSession = { id: sessionId, userId };

      sessionsRepository.findOne.mockResolvedValue(mockSession as any);

      await expect(service['assertOwnedSession'](userId, sessionId)).resolves.not.toThrow();
    });

    it('should throw BadRequestException when sessionId is missing', async () => {
      const userId = 'user123';

      await expect(service['assertOwnedSession'](userId, '')).rejects.toThrow(
        new BadRequestException('sessionId is required')
      );
    });

    it('should throw NotFoundException when session does not exist', async () => {
      const userId = 'user123';
      const sessionId = 'nonexistent';

      sessionsRepository.findOne.mockResolvedValue(null);

      await expect(service['assertOwnedSession'](userId, sessionId)).rejects.toThrow(
        new NotFoundException('Session not found')
      );
    });

    it('should throw ForbiddenException when user does not own session', async () => {
      const userId = 'user123';
      const sessionId = 'session123';
      const mockSession = { id: sessionId, userId: 'differentUser' };

      sessionsRepository.findOne.mockResolvedValue(mockSession as any);

      await expect(service['assertOwnedSession'](userId, sessionId)).rejects.toThrow(
        new ForbiddenException('You do not have access to this session')
      );
    });
  });

  describe('createMessage', () => {
    const userId = 'user123';
    const sessionId = 'session123';
    const mockSession = { id: sessionId, userId };

    beforeEach(() => {
      sessionsRepository.findOne.mockResolvedValue(mockSession as any);
    });

    it('should create a user message and generate AI response', async () => {
      const dto: CreateMessageDto = {
        role: 'user',
        content: 'Hello AI!',
        metadata: { test: true },
      };

      const mockUserMessage = {
        id: 'msg1',
        role: 'user',
        content: 'Hello AI!',
        metadata: { test: true },
        session: mockSession,
      };

      const mockAssistantMessage = {
        id: 'msg2',
        role: 'assistant',
        content: 'Hello! How can I help you?',
        metadata: { generated: true, model: 'gpt-4o-mini' },
        session: mockSession,
      };

      const mockPreviousMessages = [
        { role: 'user', content: 'Previous message' },
      ];

      messagesRepository.create.mockReturnValueOnce(mockUserMessage as any);
      messagesRepository.save.mockResolvedValueOnce(mockUserMessage as any);
      messagesRepository.find.mockResolvedValue(mockPreviousMessages as any);
      messagesRepository.create.mockReturnValueOnce(mockAssistantMessage as any);
      messagesRepository.save.mockResolvedValueOnce(mockAssistantMessage as any);
      openaiService.generateResponse.mockResolvedValue('Hello! How can I help you?');

      const result = await service.createMessage(userId, sessionId, dto);

      expect(sessionsRepository.findOne).toHaveBeenCalledWith({ where: { id: sessionId } });
      expect(messagesRepository.create).toHaveBeenCalledWith({
        role: 'user',
        content: 'Hello AI!',
        metadata: { test: true },
        session: mockSession,
      });
      expect(messagesRepository.save).toHaveBeenCalledWith(mockUserMessage);
      expect(openaiService.generateResponse).toHaveBeenCalled();
      expect(result).toEqual(mockUserMessage);
    });

    it('should create an assistant message without generating AI response', async () => {
      const dto: CreateMessageDto = {
        role: 'assistant',
        content: 'AI response',
      };

      const mockMessage = {
        id: 'msg1',
        role: 'assistant',
        content: 'AI response',
        metadata: {},
        session: mockSession,
      };

      messagesRepository.create.mockReturnValue(mockMessage as any);
      messagesRepository.save.mockResolvedValue(mockMessage as any);

      const result = await service.createMessage(userId, sessionId, dto);

      expect(messagesRepository.create).toHaveBeenCalledWith({
        role: 'assistant',
        content: 'AI response',
        metadata: {},
        session: mockSession,
      });
      expect(openaiService.generateResponse).not.toHaveBeenCalled();
      expect(result).toEqual(mockMessage);
    });

    it('should continue when OpenAI service fails', async () => {
      const dto: CreateMessageDto = {
        role: 'user',
        content: 'Hello AI!',
      };

      const mockUserMessage = {
        id: 'msg1',
        role: 'user',
        content: 'Hello AI!',
        metadata: {},
        session: mockSession,
      };

      messagesRepository.create.mockReturnValue(mockUserMessage as any);
      messagesRepository.save.mockResolvedValue(mockUserMessage as any);
      messagesRepository.find.mockResolvedValue([]);
      openaiService.generateResponse.mockRejectedValue(new Error('OpenAI error'));

      // Mock console.error to avoid output during tests
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await service.createMessage(userId, sessionId, dto);

      expect(result).toEqual(mockUserMessage);
      expect(consoleSpy).toHaveBeenCalledWith('Failed to generate AI response:', expect.any(Error));

      consoleSpy.mockRestore();
    });
  });

  describe('listMessages', () => {
    it('should return messages for a session', async () => {
      const userId = 'user123';
      const sessionId = 'session123';
      const mockSession = { id: sessionId, userId };
      const mockMessages = [
        { id: 'msg1', role: 'user', content: 'Hello' },
        { id: 'msg2', role: 'assistant', content: 'Hi there!' },
      ];

      sessionsRepository.findOne.mockResolvedValue(mockSession as any);
      messagesRepository.find.mockResolvedValue(mockMessages as any);

      const result = await service.listMessages(userId, sessionId);

      expect(messagesRepository.find).toHaveBeenCalledWith({
        where: { session: { id: sessionId } },
        order: { createdAt: 'ASC' },
      });
      expect(result).toEqual(mockMessages);
    });

    it('should throw when session assertion fails', async () => {
      const userId = 'user123';
      const sessionId = 'session123';

      sessionsRepository.findOne.mockResolvedValue(null);

      await expect(service.listMessages(userId, sessionId)).rejects.toThrow(
        new NotFoundException('Session not found')
      );
    });
  });

  describe('getChatHistory', () => {
    it('should return simplified chat history', async () => {
      const userId = 'user123';
      const sessionId = 'session123';
      const mockSession = { id: sessionId, userId };
      const mockMessages = [
        {
          id: 'msg1',
          role: 'user',
          content: 'Hello',
          createdAt: new Date('2023-01-01'),
        },
        {
          id: 'msg2',
          role: 'assistant',
          content: 'Hi there!',
          createdAt: new Date('2023-01-02'),
        },
      ];

      sessionsRepository.findOne.mockResolvedValue(mockSession as any);
      messagesRepository.find.mockResolvedValue(mockMessages as any);

      const result = await service.getChatHistory(userId, sessionId);

      expect(result).toEqual([
        {
          role: 'user',
          content: 'Hello',
          timestamp: new Date('2023-01-01'),
        },
        {
          role: 'assistant',
          content: 'Hi there!',
          timestamp: new Date('2023-01-02'),
        },
      ]);
    });
  });
});