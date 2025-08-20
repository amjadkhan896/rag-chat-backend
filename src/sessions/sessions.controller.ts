import { Controller, Post, Get, Patch, Delete, Param, Body, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiBody, ApiOkResponse, ApiCreatedResponse, ApiNoContentResponse, ApiBearerAuth, ApiHeader, ApiSecurity } from '@nestjs/swagger';
import { SessionsService } from './sessions.service';
import { RenameSessionDto } from './dto/rename-session.dto';
import { CreateSessionDto } from './dto/create-session.dto';
import { ConnectableObservable } from 'rxjs';

@ApiTags('sessions')
@ApiSecurity('x-api-key')
@ApiBearerAuth('bearer')
@ApiHeader({ name: 'x-api-key', description: 'API Key', required: true, schema: { type: 'string', example: 'your-api-key-from-env' } })
@ApiHeader({ name: 'Authorization', description: 'Bearer <token>', required: true, schema: { type: 'string', example: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' } })
@Controller('sessions')
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) { }

  @Post()
  @ApiOperation({ summary: 'Create a new session' })
  @ApiCreatedResponse({ description: 'Session created' })
  @ApiBody({ type: CreateSessionDto })
  createSession(@Req() req: any, @Body() body: CreateSessionDto) {
    return this.sessionsService.createSession(req.user.id, body.title);
  }

  @Patch(':id/rename')
  @ApiOperation({ summary: 'Rename a session' })
  @ApiParam({ name: 'id', description: 'Session ID (UUID)' })
  @ApiBody({ type: RenameSessionDto })
  @ApiOkResponse({ description: 'Renamed session returned' })
  renameSession(@Param('id') id: string, @Body() body: RenameSessionDto, @Req() req: any) {
    return this.sessionsService.renameSession(req.user.id, id, body.title);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a session' })
  @ApiParam({ name: 'id', description: 'Session ID (UUID)' })
  @ApiNoContentResponse({ description: 'Session deleted' })
  deleteSession(@Param('id') id: string, @Req() req: any) {
    return this.sessionsService.deleteSession(req.user.id, id);
  }

  @Patch(':id/favorite')
  @ApiOperation({ summary: 'Toggle session favorite status' })
  @ApiParam({ name: 'id', description: 'Session ID (UUID)' })
  @ApiOkResponse({ description: 'Updated session returned' })
  toggleFavorite(@Param('id') id: string, @Req() req: any) {
    return this.sessionsService.toggleFavorite(req.user.id, id);
  }

  @Get()
  @ApiOperation({ summary: 'Get recent sessions' })
  @ApiOkResponse({ description: 'List of recent sessions' })
  getRecentSessions(@Req() req: any) {
    return this.sessionsService.getRecentSessions(req.user.id);
  }
}