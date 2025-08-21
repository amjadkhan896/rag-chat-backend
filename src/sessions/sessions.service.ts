import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatSession } from './session.entity';

@Injectable()
export class SessionsService {
  private readonly logger = new Logger(SessionsService.name);

  constructor(
    @InjectRepository(ChatSession)
    private sessionsRepository: Repository<ChatSession>,
  ) { }

  async createSession(userId: string, title?: string): Promise<ChatSession> {

    // Validate title if provided
    if (title !== undefined && title !== null) {
      if (typeof title !== 'string') {
        throw new BadRequestException('Title must be a string');
      }
      if (title.trim().length === 0) {
        throw new BadRequestException('Title cannot be empty');
      }
      if (title.length > 100) {
        throw new BadRequestException('Title cannot exceed 100 characters');
      }
    }

    try {
      const session = this.sessionsRepository.create({
        userId,
        title: title && title.trim().length > 0 ? title.trim() : 'New Session',
      });
      return await this.sessionsRepository.save(session);
    } catch (error) {
      this.logger.error(`Failed to create session: ${error.message}`);
      throw new BadRequestException('Failed to create session');
    }
  }

  async renameSession(userId: string, id: string, title: string): Promise<ChatSession> {

    if (!title) {
      throw new BadRequestException('Title is required');
    }
    if (typeof title !== 'string') {
      throw new BadRequestException('Title must be a string');
    }
    if (title.trim().length === 0) {
      throw new BadRequestException('Title cannot be empty');
    }
    if (title.length > 100) {
      throw new BadRequestException('Title cannot exceed 100 characters');
    }

    try {
      const session = await this.sessionsRepository.findOne({ where: { id, userId } });
      if (!session) {
        throw new NotFoundException(`Session with id ${id} not found`);
      }

      await this.sessionsRepository.update({ id, userId }, { title: title.trim() });
      const updatedSession = await this.sessionsRepository.findOne({ where: { id, userId } });
      if (!updatedSession) {
        throw new NotFoundException(`Session with id ${id} not found after update`);
      }
      return updatedSession;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Failed to rename session: ${error.message}`);
      throw new BadRequestException('Failed to rename session');
    }
  }

  async deleteSession(userId: string, id: string): Promise<void> {
    if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
      throw new BadRequestException('User ID is required');
    }
    if (!id || typeof id !== 'string' || id.trim().length === 0) {
      throw new BadRequestException('Session ID is required');
    }

    try {
      const session = await this.sessionsRepository.findOne({ where: { id, userId } });
      if (!session) {
        throw new NotFoundException(`Session with id ${id} not found`);
      }

      await this.sessionsRepository.delete({ id, userId });
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Failed to delete session: ${error.message}`);
      throw new BadRequestException('Failed to delete session');
    }
  }

  async toggleFavorite(userId: string, id: string): Promise<ChatSession> {

    if (!id || typeof id !== 'string' || id.trim().length === 0) {
      throw new BadRequestException('Session ID is required');
    }

    try {
      const session = await this.sessionsRepository.findOne({ where: { id, userId } });
      if (!session) {
        throw new NotFoundException(`Session with id ${id} not found`);
      }

      session.favorite = !session.favorite;
      return await this.sessionsRepository.save(session);
    } catch (error) {

      this.logger.error(`Failed to toggle favorite: ${error.message}`);
      throw new BadRequestException('Failed to toggle favorite');
    }
  }

  async getRecentSessions(userId: string): Promise<ChatSession[]> {
    if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
      throw new BadRequestException('User ID is required');
    }

    try {
      return this.sessionsRepository.find({
        where: { userId },
        order: { createdAt: 'DESC' },
        relations: ['messages'],
      });
    } catch (error) {
      this.logger.error(`Failed to fetch sessions: ${error.message}`);
      throw new BadRequestException('Failed to fetch sessions');
    }
  }
}