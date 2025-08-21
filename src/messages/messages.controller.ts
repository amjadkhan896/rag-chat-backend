import { Body, Controller, Get, Param, Post, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiBody, ApiCreatedResponse, ApiOkResponse, ApiBearerAuth, ApiHeader, ApiSecurity } from '@nestjs/swagger';
import { CreateMessageDto } from './dto/create-message.dto';
import { MessagesService } from './messages.service';

@ApiTags('messages')
@ApiSecurity('x-api-key')
@ApiBearerAuth('bearer')
@ApiHeader({ name: 'x-api-key', description: 'API Key', required: true, schema: { type: 'string', example: 'your-api-key-from-env' } })
@ApiHeader({ name: 'Authorization', description: 'Bearer <token>', required: true, schema: { type: 'string', example: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' } })
@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) { }
  @Post(':sessionId')
  @ApiOperation({ summary: 'Create a message in a session' })
  @ApiParam({ name: 'sessionId', description: 'Session ID (UUID)' })
  @ApiBody({ type: CreateMessageDto })
  @ApiCreatedResponse({ description: 'Message created' })
  createMessage(
    @Param('sessionId') sessionId: string,
    @Body() body: CreateMessageDto,
    @Req() req: any,
  ) {
    return this.messagesService.createMessage(req.user.id, sessionId, body);
  }

  @Get(':sessionId')
  @ApiOperation({ summary: 'List messages for a session' })
  @ApiParam({ name: 'sessionId', description: 'Session ID (UUID)' })
  @ApiOkResponse({ description: 'List of messages' })
  listMessages(@Param('sessionId') sessionId: string, @Req() req: any) {
    return this.messagesService.listMessages(req.user.id, sessionId);
  }
}
