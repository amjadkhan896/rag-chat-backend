import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class CreateMessageDto {
  @ApiProperty({ enum: ['user', 'assistant'] as const, example: 'user' })
  @IsEnum(['user', 'assistant'] as const)
  role!: 'user' | 'assistant';

  @ApiProperty({ example: 'Hello, can you help me?' })
  @IsString()
  content!: string;

  @ApiProperty({ required: false, description: 'Optional metadata bag' })
  @IsOptional()
  metadata?: Record<string, any>;
}


