import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn
} from 'typeorm';
import { ChatMessage } from '../messages/message.entity';

@Entity()
export class ChatSession {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar' })
  title!: string;   // same as name, but renamed like your other model

  @Column({ type: 'varchar', nullable: true })
  userId?: string;  // if you need to associate with a user

  @Column({ type: 'jsonb', default: {} })
  metadata!: Record<string, any>;   // if needed, else remove

  @Column({ type: 'boolean', default: false })
  favorite!: boolean;

  @OneToMany(() => ChatMessage, (message) => message.session, {
    cascade: true,
    eager: false,
  })
  messages!: ChatMessage[];

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt!: Date;
}