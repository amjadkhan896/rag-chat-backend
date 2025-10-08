import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MessagesService } from './messages.service';
import { MessagesController } from './messages.controller';
import { ChatSession } from '../sessions/session.entity';
import { ChatMessage } from './message.entity';
import { RagModule } from '../rag/rag.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ChatSession, ChatMessage]),
    RagModule
  ],
  providers: [MessagesService],
  controllers: [MessagesController]
})
export class MessagesModule { }
