import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { ChatSession } from './session.entity';

describe('SessionsService', () => {
  let service: SessionsService;
  let repository: jest.Mocked<Repository<ChatSession>>;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SessionsService,
        {
          provide: getRepositoryToken(ChatSession),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<SessionsService>(SessionsService);
    repository = module.get(getRepositoryToken(ChatSession));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createSession', () => {
    it('should create a session with title', async () => {
      const userId = 'user123';
      const title = 'Test Session';
      const mockSession = { id: 'session123', title, userId, favorite: false };

      repository.create.mockReturnValue(mockSession as any);
      repository.save.mockResolvedValue(mockSession as any);

      const result = await service.createSession(userId, title);

      expect(repository.create).toHaveBeenCalledWith({
        userId,
        title,
        favorite: false,
      });
      expect(repository.save).toHaveBeenCalledWith(mockSession);
      expect(result).toEqual(mockSession);
    });

    it('should create a session without title', async () => {
      const userId = 'user123';
      const mockSession = { id: 'session123', title: undefined, userId, favorite: false };

      repository.create.mockReturnValue(mockSession as any);
      repository.save.mockResolvedValue(mockSession as any);

      const result = await service.createSession(userId);

      expect(repository.create).toHaveBeenCalledWith({
        userId,
        title: undefined,
        favorite: false,
      });
      expect(result).toEqual(mockSession);
    });

    it('should throw BadRequestException for non-string title', async () => {
      const userId = 'user123';
      const title = 123 as any;

      await expect(service.createSession(userId, title)).rejects.toThrow(
        new BadRequestException('Title must be a string')
      );
    });

    it('should throw BadRequestException for empty title', async () => {
      const userId = 'user123';
      const title = '   ';

      await expect(service.createSession(userId, title)).rejects.toThrow(
        new BadRequestException('Title cannot be empty')
      );
    });

    it('should throw BadRequestException for title exceeding 100 characters', async () => {
      const userId = 'user123';
      const title = 'a'.repeat(101);

      await expect(service.createSession(userId, title)).rejects.toThrow(
        new BadRequestException('Title cannot exceed 100 characters')
      );
    });

    it('should throw BadRequestException when save fails', async () => {
      const userId = 'user123';
      const title = 'Test Session';

      repository.create.mockReturnValue({} as any);
      repository.save.mockRejectedValue(new Error('Database error'));

      await expect(service.createSession(userId, title)).rejects.toThrow(
        new BadRequestException('Failed to create session')
      );
    });
  });

  describe('renameSession', () => {
    it('should rename a session successfully', async () => {
      const userId = 'user123';
      const sessionId = 'session123';
      const newTitle = 'New Title';
      const mockSession = { id: sessionId, userId, title: 'Old Title' };
      const updatedSession = { ...mockSession, title: newTitle };

      repository.findOne.mockResolvedValue(mockSession as any);
      repository.save.mockResolvedValue(updatedSession as any);

      const result = await service.renameSession(userId, sessionId, newTitle);

      expect(repository.findOne).toHaveBeenCalledWith({ where: { id: sessionId } });
      expect(repository.save).toHaveBeenCalledWith({ ...mockSession, title: newTitle });
      expect(result).toEqual(updatedSession);
    });

    it('should throw BadRequestException when title is missing', async () => {
      const userId = 'user123';
      const sessionId = 'session123';

      await expect(service.renameSession(userId, sessionId, null as any)).rejects.toThrow(
        new BadRequestException('Title is required')
      );
    });

    it('should throw NotFoundException when session does not exist', async () => {
      const userId = 'user123';
      const sessionId = 'nonexistent';
      const title = 'New Title';

      repository.findOne.mockResolvedValue(null);

      await expect(service.renameSession(userId, sessionId, title)).rejects.toThrow(
        new NotFoundException('Session not found')
      );
    });

    it('should throw ForbiddenException when user does not own the session', async () => {
      const userId = 'user123';
      const sessionId = 'session123';
      const title = 'New Title';
      const mockSession = { id: sessionId, userId: 'differentUser', title: 'Old Title' };

      repository.findOne.mockResolvedValue(mockSession as any);

      await expect(service.renameSession(userId, sessionId, title)).rejects.toThrow(
        new ForbiddenException('You do not have access to this session')
      );
    });
  });

  describe('deleteSession', () => {
    it('should delete a session successfully', async () => {
      const userId = 'user123';
      const sessionId = 'session123';
      const mockSession = { id: sessionId, userId };

      repository.findOne.mockResolvedValue(mockSession as any);
      repository.delete.mockResolvedValue({ affected: 1 } as any);

      await service.deleteSession(userId, sessionId);

      expect(repository.findOne).toHaveBeenCalledWith({ where: { id: sessionId } });
      expect(repository.delete).toHaveBeenCalledWith(sessionId);
    });

    it('should throw NotFoundException when session does not exist', async () => {
      const userId = 'user123';
      const sessionId = 'nonexistent';

      repository.findOne.mockResolvedValue(null);

      await expect(service.deleteSession(userId, sessionId)).rejects.toThrow(
        new NotFoundException('Session not found')
      );
    });

    it('should throw ForbiddenException when user does not own the session', async () => {
      const userId = 'user123';
      const sessionId = 'session123';
      const mockSession = { id: sessionId, userId: 'differentUser' };

      repository.findOne.mockResolvedValue(mockSession as any);

      await expect(service.deleteSession(userId, sessionId)).rejects.toThrow(
        new ForbiddenException('You do not have access to this session')
      );
    });
  });

  describe('toggleFavorite', () => {
    it('should toggle favorite status successfully', async () => {
      const userId = 'user123';
      const sessionId = 'session123';
      const mockSession = { id: sessionId, userId, favorite: false };
      const updatedSession = { ...mockSession, favorite: true };

      repository.findOne.mockResolvedValue(mockSession as any);
      repository.save.mockResolvedValue(updatedSession as any);

      const result = await service.toggleFavorite(userId, sessionId);

      expect(repository.findOne).toHaveBeenCalledWith({ where: { id: sessionId } });
      expect(repository.save).toHaveBeenCalledWith({ ...mockSession, favorite: true });
      expect(result).toEqual(updatedSession);
    });

    it('should throw BadRequestException when sessionId is invalid', async () => {
      const userId = 'user123';
      const sessionId = '';

      await expect(service.toggleFavorite(userId, sessionId)).rejects.toThrow(
        new BadRequestException('Session ID is required')
      );
    });
  });

  describe('getRecentSessions', () => {
    it('should return recent sessions for user', async () => {
      const userId = 'user123';
      const mockSessions = [
        { id: 'session1', userId, title: 'Session 1' },
        { id: 'session2', userId, title: 'Session 2' },
      ];

      repository.find.mockResolvedValue(mockSessions as any);

      const result = await service.getRecentSessions(userId);

      expect(repository.find).toHaveBeenCalledWith({
        where: { userId },
        order: { createdAt: 'DESC' },
        relations: ['messages'],
      });
      expect(result).toEqual(mockSessions);
    });

    it('should return empty array when no sessions found', async () => {
      const userId = 'user123';

      repository.find.mockResolvedValue([]);

      const result = await service.getRecentSessions(userId);

      expect(result).toEqual([]);
    });
  });
});