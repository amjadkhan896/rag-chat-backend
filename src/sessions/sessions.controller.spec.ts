import { Test } from '@nestjs/testing';
import { SessionsController } from './sessions.controller';
import { SessionsService } from './sessions.service';

describe('SessionsController', () => {
  let controller: SessionsController;
  let mockService = {
    createSession: jest.fn(),
    renameSession: jest.fn(),
    deleteSession: jest.fn(),
    toggleFavorite: jest.fn(),
    getRecentSessions: jest.fn(),
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [SessionsController],
      providers: [
        {
          provide: SessionsService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get(SessionsController);
    jest.clearAllMocks();
  });

  it('creates session', async () => {
    const mockRequest = { user: { id: 'user1' } };
    const mockBody = { title: 'Test Session' };
    const mockSession = { id: 'session1', title: 'Test Session', userId: 'user1' };

    mockService.createSession.mockResolvedValue(mockSession);

    const result = await controller.createSession(mockRequest as any, mockBody);

    expect(mockService.createSession).toHaveBeenCalledWith('user1', 'Test Session');
    expect(result).toEqual(mockSession);
  });

  it('renames session', async () => {
    const mockRequest = { user: { id: 'user1' } };
    const mockBody = { title: 'New Title' };
    const mockSession = { id: 'session1', title: 'New Title', userId: 'user1' };

    mockService.renameSession.mockResolvedValue(mockSession);

    const result = await controller.renameSession('session1', mockBody, mockRequest as any);

    expect(mockService.renameSession).toHaveBeenCalledWith('user1', 'session1', 'New Title');
    expect(result).toEqual(mockSession);
  });

  it('deletes session', async () => {
    const mockRequest = { user: { id: 'user1' } };

    await controller.deleteSession('session1', mockRequest as any);

    expect(mockService.deleteSession).toHaveBeenCalledWith('user1', 'session1');
  });

  it('gets recent sessions', async () => {
    const mockRequest = { user: { id: 'user1' } };
    const mockSessions = [{ id: 'session1', title: 'Session 1' }];

    mockService.getRecentSessions.mockResolvedValue(mockSessions);

    const result = await controller.getRecentSessions(mockRequest as any);

    expect(mockService.getRecentSessions).toHaveBeenCalledWith('user1');
    expect(result).toEqual(mockSessions);
  });
});