import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateMessageDto } from './dto/create-message.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatSession } from '../sessions/session.entity';
import { ChatMessage } from './message.entity';
import { RagChainService } from '../rag/rag-chain.service';

export type MessageRecord = ChatMessage;

@Injectable()
export class MessagesService {

  constructor(
    @InjectRepository(ChatSession)
    private readonly sessionsRepository: Repository<ChatSession>,
    @InjectRepository(ChatMessage)
    private readonly messagesRepository: Repository<ChatMessage>,
    private readonly ragChainService: RagChainService,
  ) { }

  private async assertOwnedSession(userId: string, sessionId: string): Promise<void> {
    if (!sessionId) {
      throw new BadRequestException('sessionId is required');
    }
    const session = await this.sessionsRepository.findOne({ where: { id: sessionId } });
    if (!session) {
      throw new NotFoundException('Session not found');
    }
    if (session.userId?.toString() !== userId.toString()) {
      throw new ForbiddenException('You do not have access to this session');
    }
  }

  async createMessage(
    userId: string,
    sessionId: string,
    payload: CreateMessageDto,
  ): Promise<MessageRecord> {
    await this.assertOwnedSession(userId, sessionId);

    const session = await this.sessionsRepository.findOne({ where: { id: sessionId } });

    // Save user message
    const userMessage = this.messagesRepository.create({
      role: payload.role,
      content: payload.content,
      metadata: payload.metadata ?? {},
      session: session!,
    });
    const savedUserMessage = await this.messagesRepository.save(userMessage);

    // If user message, generate AI response using RAG
    if (payload.role === 'user') {
      try {
        // Generate AI response using RAG chain
        const aiResponse = await this.ragChainService.generateResponse(payload.content);

        // Save AI response
        const assistantMessage = this.messagesRepository.create({
          role: 'assistant',
          content: aiResponse,
          metadata: {
            generated: true,
            model: 'gpt-4o',
            ragEnabled: true,
            timestamp: new Date().toISOString()
          },
          session: session!,
        });
        await this.messagesRepository.save(assistantMessage);

      } catch (error) {
        console.error('Failed to generate RAG response:', error);
        // Continue without AI response if it fails
      }
    }

    return savedUserMessage;
  }

  async listMessages(
    userId: string,
    sessionId: string,
  ): Promise<MessageRecord[]> {
    await this.assertOwnedSession(userId, sessionId);
    return this.messagesRepository.find({
      where: { session: { id: sessionId } },
      order: { createdAt: 'ASC' },
    });
  }

  async getChatHistory(
    userId: string,
    sessionId: string,
  ): Promise<{ role: string; content: string; timestamp: Date }[]> {
    const messages = await this.listMessages(userId, sessionId);
    return messages.map(msg => ({
      role: msg.role,
      content: msg.content,
      timestamp: msg.createdAt,
    }));
  }

  /**
   * Generate streaming response using RAG
   */
  async generateStreamingResponse(
    userId: string,
    sessionId: string,
    question: string,
    onChunk: (chunk: string) => void
  ): Promise<void> {
    await this.assertOwnedSession(userId, sessionId);

    try {
      // Save user message first
      const session = await this.sessionsRepository.findOne({ where: { id: sessionId } });
      const userMessage = this.messagesRepository.create({
        role: 'user',
        content: question,
        metadata: { streaming: true },
        session: session!,
      });
      await this.messagesRepository.save(userMessage);

      // Generate streaming response
      let fullResponse = '';
      await this.ragChainService.generateStreamingResponse(question, (chunk) => {
        fullResponse += chunk;
        onChunk(chunk);
      });

      // Save the complete assistant response
      const assistantMessage = this.messagesRepository.create({
        role: 'assistant',
        content: fullResponse,
        metadata: {
          generated: true,
          model: 'gpt-4o',
          ragEnabled: true,
          streaming: true,
          timestamp: new Date().toISOString()
        },
        session: session!,
      });
      await this.messagesRepository.save(assistantMessage);

    } catch (error) {
      console.error('Failed to generate streaming RAG response:', error);
      throw error;
    }
  }
}
