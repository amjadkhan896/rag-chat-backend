import { Test, TestingModule } from '@nestjs/testing';
import { SessionsController } from './sessions.controller';
import { SessionsService } from './sessions.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { RenameSessionDto } from './dto/rename-session.dto';

describe('SessionsController', () => {
  let controller: SessionsController;
  let service: jest.Mocked<SessionsService>;

  const mockSessionsService = {
    createSession: jest.fn(),
    renameSession: jest.fn(),
    deleteSession: jest.fn(),
    toggleFavorite: jest.fn(),
    getRecentSessions: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SessionsController],
      providers: [
        {
          provide: SessionsService,
          useValue: mockSessionsService,
        },
      ],
    }).compile();

    controller = module.get<SessionsController>(SessionsController);
    service = module.get(SessionsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createSession', () => {
    it('should create a session successfully', async () => {
      const mockRequest = { user: { id: 'user123' } };
      const dto: CreateSessionDto = { title: 'Test Session' };
      const mockSession = { id: 'session123', title: 'Test Session', userId: 'user123' };

      service.createSession.mockResolvedValue(mockSession as any);

      const result = await controller.createSession(dto, mockRequest as any);

      expect(service.createSession).toHaveBeenCalledWith('user123', 'Test Session');
      expect(result).toEqual(mockSession);
    });

    it('should create a session without title', async () => {
      const mockRequest = { user: { id: 'user123' } };
      const dto: CreateSessionDto = {};
      const mockSession = { id: 'session123', userId: 'user123' };

      service.createSession.mockResolvedValue(mockSession as any);

      const result = await controller.createSession(dto, mockRequest as any);

      expect(service.createSession).toHaveBeenCalledWith('user123', undefined);
      expect(result).toEqual(mockSession);
    });
  });

  describe('renameSession', () => {
    it('should rename a session successfully', async () => {
      const mockRequest = { user: { id: 'user123' } };
      const sessionId = 'session123';
      const dto: RenameSessionDto = { title: 'New Title' };
      const mockSession = { id: sessionId, title: 'New Title', userId: 'user123' };

      service.renameSession.mockResolvedValue(mockSession as any);

      const result = await controller.renameSession(sessionId, dto, mockRequest as any);

      expect(service.renameSession).toHaveBeenCalledWith('user123', sessionId, 'New Title');
      expect(result).toEqual(mockSession);
    });
  });

  describe('deleteSession', () => {
    it('should delete a session successfully', async () => {
      const mockRequest = { user: { id: 'user123' } };
      const sessionId = 'session123';

      service.deleteSession.mockResolvedValue(undefined);

      await controller.deleteSession(sessionId, mockRequest as any);

      expect(service.deleteSession).toHaveBeenCalledWith('user123', sessionId);
    });
  });

  describe('toggleFavorite', () => {
    it('should toggle favorite status successfully', async () => {
      const mockRequest = { user: { id: 'user123' } };
      const sessionId = 'session123';
      const mockSession = { id: sessionId, favorite: true, userId: 'user123' };

      service.toggleFavorite.mockResolvedValue(mockSession as any);

      const result = await controller.toggleFavorite(sessionId, mockRequest as any);

      expect(service.toggleFavorite).toHaveBeenCalledWith('user123', sessionId);
      expect(result).toEqual(mockSession);
    });
  });

  describe('getRecentSessions', () => {
    it('should get recent sessions successfully', async () => {
      const mockRequest = { user: { id: 'user123' } };
      const mockSessions = [
        { id: 'session1', title: 'Session 1', userId: 'user123' },
        { id: 'session2', title: 'Session 2', userId: 'user123' },
      ];

      service.getRecentSessions.mockResolvedValue(mockSessions as any);

      const result = await controller.getRecentSessions(mockRequest as any);

      expect(service.getRecentSessions).toHaveBeenCalledWith('user123');
      expect(result).toEqual(mockSessions);
    });
  });
});
