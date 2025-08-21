import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('root')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) { }

  @Get('/healthCheck')
  @ApiOperation({ summary: 'Health check' })
  @ApiOkResponse({ description: 'Returns  OK' })
  getHealthCheck(): string {
    return this.appService.getHealthCheck();
  }
}
