import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class ApiKeyMiddleware implements NestMiddleware {
  constructor(private readonly configService: ConfigService) { }

  use(req: Request, res: Response, next: NextFunction) {
    const apiKey = req.headers['x-api-key'] as string;
    const validApiKey = this.configService.get<string>('X_API_KEY');

    if (!validApiKey) {
      throw new UnauthorizedException('API key configuration is missing');
    }

    if (!apiKey) {
      throw new UnauthorizedException('API key is required');
    }

    if (apiKey !== validApiKey) {
      throw new UnauthorizedException('Invalid API key');
    }

    next();
  }
}
