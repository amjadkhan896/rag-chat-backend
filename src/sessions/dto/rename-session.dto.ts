import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, MaxLength, IsNotEmpty } from 'class-validator';

export class RenameSessionDto {
  @ApiProperty({ description: 'New title for the session', example: 'Project brainstorm' })
  @IsNotEmpty({ message: 'Title is required' })
  @IsString({ message: 'Title must be a string' })
  @MinLength(1, { message: 'Title cannot be empty' })
  @MaxLength(100, { message: 'Title cannot exceed 100 characters' })
  title!: string;
}


