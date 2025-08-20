import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MessagesService } from './messages.service';
import { MessagesController } from './messages.controller';
import { ChatSession } from '../sessions/session.entity';
import { ChatMessage } from './message.entity';
import { OpenaiModule } from '../openai/openai.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ChatSession, ChatMessage]),
    OpenaiModule
  ],
  providers: [MessagesService],
  controllers: [MessagesController]
})
export class MessagesModule { }
