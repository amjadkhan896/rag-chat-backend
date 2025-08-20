import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength, MaxLength } from 'class-validator';

export class CreateSessionDto {
  @ApiProperty({ description: 'Session title', example: 'Project brainstorm', required: false })
  @IsOptional()
  @IsString({ message: 'Title must be a string' })
  @MinLength(1, { message: 'Title cannot be empty' })
  @MaxLength(100, { message: 'Title cannot exceed 100 characters' })
  title?: string;
}


