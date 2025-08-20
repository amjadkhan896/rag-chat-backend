import { Test, TestingModule } from '@nestjs/testing';
import { MessagesController } from './messages.controller';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';

describe('MessagesController', () => {
  let controller: MessagesController;
  let service: jest.Mocked<MessagesService>;

  const mockMessagesService = {
    createMessage: jest.fn(),
    listMessages: jest.fn(),
    getChatHistory: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MessagesController],
      providers: [
        {
          provide: MessagesService,
          useValue: mockMessagesService,
        },
      ],
    }).compile();

    controller = module.get<MessagesController>(MessagesController);
    service = module.get(MessagesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createMessage', () => {
    it('should create a message successfully', async () => {
      const sessionId = 'session123';
      const mockRequest = { user: { id: 'user123' } };
      const dto: CreateMessageDto = {
        role: 'user',
        content: 'Hello AI!',
        metadata: { test: true },
      };
      const mockMessage = {
        id: 'msg123',
        role: 'user',
        content: 'Hello AI!',
        metadata: { test: true },
      };

      service.createMessage.mockResolvedValue(mockMessage as any);

      const result = await controller.createMessage(sessionId, dto, mockRequest as any);

      expect(service.createMessage).toHaveBeenCalledWith('user123', sessionId, dto);
      expect(result).toEqual(mockMessage);
    });

    it('should handle assistant messages', async () => {
      const sessionId = 'session123';
      const mockRequest = { user: { id: 'user123' } };
      const dto: CreateMessageDto = {
        role: 'assistant',
        content: 'AI response',
      };
      const mockMessage = {
        id: 'msg123',
        role: 'assistant',
        content: 'AI response',
      };

      service.createMessage.mockResolvedValue(mockMessage as any);

      const result = await controller.createMessage(sessionId, dto, mockRequest as any);

      expect(service.createMessage).toHaveBeenCalledWith('user123', sessionId, dto);
      expect(result).toEqual(mockMessage);
    });
  });

  describe('listMessages', () => {
    it('should list messages for a session', async () => {
      const sessionId = 'session123';
      const mockRequest = { user: { id: 'user123' } };
      const mockMessages = [
        { id: 'msg1', role: 'user', content: 'Hello' },
        { id: 'msg2', role: 'assistant', content: 'Hi there!' },
      ];

      service.listMessages.mockResolvedValue(mockMessages as any);

      const result = await controller.listMessages(sessionId, mockRequest as any);

      expect(service.listMessages).toHaveBeenCalledWith('user123', sessionId);
      expect(result).toEqual(mockMessages);
    });

    it('should return empty array when no messages found', async () => {
      const sessionId = 'session123';
      const mockRequest = { user: { id: 'user123' } };

      service.listMessages.mockResolvedValue([]);

      const result = await controller.listMessages(sessionId, mockRequest as any);

      expect(service.listMessages).toHaveBeenCalledWith('user123', sessionId);
      expect(result).toEqual([]);
    });
  });

  describe('getChatHistory', () => {
    it('should get chat history for a session', async () => {
      const sessionId = 'session123';
      const mockRequest = { user: { id: 'user123' } };
      const mockHistory = [
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
      ];

      service.getChatHistory.mockResolvedValue(mockHistory as any);

      const result = await controller.getChatHistory(sessionId, mockRequest as any);

      expect(service.getChatHistory).toHaveBeenCalledWith('user123', sessionId);
      expect(result).toEqual(mockHistory);
    });

    it('should return empty array when no history found', async () => {
      const sessionId = 'session123';
      const mockRequest = { user: { id: 'user123' } };

      service.getChatHistory.mockResolvedValue([]);

      const result = await controller.getChatHistory(sessionId, mockRequest as any);

      expect(service.getChatHistory).toHaveBeenCalledWith('user123', sessionId);
      expect(result).toEqual([]);
    });
  });
});
