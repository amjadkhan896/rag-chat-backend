import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateMessageDto } from './dto/create-message.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatSession } from '../sessions/session.entity';
import { ChatMessage } from './message.entity';
import { OpenaiService } from '../openai/openai.service';

export type MessageRecord = ChatMessage;

@Injectable()
export class MessagesService {

  constructor(
    @InjectRepository(ChatSession)
    private readonly sessionsRepository: Repository<ChatSession>,
    @InjectRepository(ChatMessage)
    private readonly messagesRepository: Repository<ChatMessage>,
    private readonly openaiService: OpenaiService,
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

    // If user message, generate AI response
    if (payload.role === 'user') {
      try {
        // Get conversation history for context
        const previousMessages = await this.messagesRepository.find({
          where: { session: { id: sessionId } },
          order: { createdAt: 'ASC' },
          take: 10, // Last 10 messages for context
        });

        // Build conversation context
        const conversationHistory = previousMessages.map(msg =>
          `${msg.role}: ${msg.content}`
        ).join('\n');

        const prompt = `Previous conversation:\n${conversationHistory}\n\nPlease respond to the latest user message.`;

        // Generate AI response
        const aiResponse = await this.openaiService.generateResponse(prompt);
       console.log(JSON.stringify(aiResponse), 'wwwww')
        // Save AI response
        const assistantMessage = this.messagesRepository.create({
          role: 'assistant',
          content: aiResponse,
          metadata: { generated: true, model: 'gpt-5o' },
          session: session!,
        });
        await this.messagesRepository.save(assistantMessage);

      } catch (error) {
        console.error('Failed to generate AI response:', error);
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
}
