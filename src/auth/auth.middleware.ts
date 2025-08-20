import { Injectable, NestMiddleware, UnauthorizedException, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(private readonly configService: ConfigService) { }

  use(req: Request, _res: Response, next: NextFunction) {
    try {
      // Read Authorization header
      const authHeader = req.headers['authorization'] || req.headers['Authorization'];
      if (!authHeader || typeof authHeader !== 'string') {
        throw new UnauthorizedException('Missing Authorization header');
      }

      // Expect format: "Bearer <token>"
      const [scheme, token] = authHeader.split(' ');
      if (scheme.toLowerCase() !== 'bearer' || !token) {
        throw new UnauthorizedException('Invalid Authorization header format');
      }

      // Verify token using JWT secret from environment (.env)
      const secret = this.configService.get<string>('JWT_SECRET');
      if (!secret) {
        throw new InternalServerErrorException('JWT_SECRET is not configured');
      }
      const decoded = jwt.verify(token, secret) as any;

      const id = decoded?.id ?? decoded?.userId ?? decoded?.sub;
      if (!id) {
        throw new UnauthorizedException('Token does not include a valid user id');
      }

      // Normalize user object on request
      (req as any).user = { id: id.toString() };

      next();
    } catch (err) {
      // Always throw UnauthorizedException on any failure
      throw new UnauthorizedException(
        err instanceof Error ? err.message : 'Unauthorized',
      );
    }
  }
}
