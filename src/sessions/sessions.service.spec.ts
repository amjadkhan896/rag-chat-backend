import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { ChatSession } from './session.entity';

describe('SessionsService', () => {
  let service: SessionsService;
  let mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    delete: jest.fn(),
    update: jest.fn(),
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        SessionsService,
        {
          provide: getRepositoryToken(ChatSession),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get(SessionsService);
    jest.clearAllMocks();
  });

  describe('createSession', () => {
    it('creates session with title', async () => {
      const mockSession = { id: 'session1', title: 'My Session', userId: 'user1' };
      mockRepository.create.mockReturnValue(mockSession);
      mockRepository.save.mockResolvedValue(mockSession);

      const result = await service.createSession('user1', 'My Session');

      expect(result).toEqual(mockSession);
    });

    it('creates session with default title when none provided', async () => {
      const mockSession = { id: 'session1', title: 'New Session', userId: 'user1' };
      mockRepository.create.mockReturnValue(mockSession);
      mockRepository.save.mockResolvedValue(mockSession);

      await service.createSession('user1');

      expect(mockRepository.create).toHaveBeenCalledWith({
        userId: 'user1',
        title: 'New Session',
      });
    });

    it('throws error for invalid title', async () => {
      await expect(service.createSession('user1', 123 as any))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('renameSession', () => {
    it('renames session successfully', async () => {
      const mockSession = { id: 'session1', userId: 'user1', title: 'Old Title' };
      const updatedSession = { ...mockSession, title: 'New Title' };

      mockRepository.findOne.mockResolvedValueOnce(mockSession);
      mockRepository.findOne.mockResolvedValueOnce(updatedSession);

      const result = await service.renameSession('user1', 'session1', 'New Title');

      expect(result).toEqual(updatedSession);
    });

    it('throws error when session not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.renameSession('user1', 'session1', 'New Title'))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteSession', () => {
    it('deletes session successfully', async () => {
      const mockSession = { id: 'session1', userId: 'user1' };
      mockRepository.findOne.mockResolvedValue(mockSession);

      await service.deleteSession('user1', 'session1');

      expect(mockRepository.delete).toHaveBeenCalledWith({ id: 'session1', userId: 'user1' });
    });

    it('throws error when session not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.deleteSession('user1', 'session1'))
        .rejects.toThrow(NotFoundException);
    });
  });

  describe('getRecentSessions', () => {
    it('returns user sessions', async () => {
      const mockSessions = [
        { id: 'session1', userId: 'user1', title: 'Session 1' },
        { id: 'session2', userId: 'user1', title: 'Session 2' },
      ];
      mockRepository.find.mockResolvedValue(mockSessions);

      const result = await service.getRecentSessions('user1');

      expect(result).toEqual(mockSessions);
    });
  });
});