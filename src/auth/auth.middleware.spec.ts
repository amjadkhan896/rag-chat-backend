import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { AuthMiddleware } from './auth.middleware';
import * as jwt from 'jsonwebtoken';

jest.mock('jsonwebtoken');
const mockJwt = jwt as jest.Mocked<typeof jwt>;

describe('AuthMiddleware', () => {
  let middleware: AuthMiddleware;
  let mockNext = jest.fn();

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        AuthMiddleware,
        {
          provide: ConfigService,
          useValue: { get: () => 'secret-key' },
        },
      ],
    }).compile();

    middleware = module.get(AuthMiddleware);
    mockNext.mockClear();
  });

  it('allows request with valid JWT token', () => {
    mockJwt.verify.mockReturnValue({ id: 'user123' } as any);
    const mockRequest = {
      headers: { authorization: 'Bearer valid-token' },
      user: undefined
    };

    middleware.use(mockRequest as any, {} as any, mockNext);

    expect(mockRequest.user).toEqual({ id: 'user123' });
    expect(mockNext).toHaveBeenCalled();
  });

  it('rejects request without authorization header', () => {
    const mockRequest = { headers: {} };

    expect(() => {
      middleware.use(mockRequest as any, {} as any, mockNext);
    }).toThrow(UnauthorizedException);
  });

  it('rejects request with invalid token', () => {
    mockJwt.verify.mockImplementation(() => {
      throw new Error('Invalid token');
    });
    const mockRequest = { headers: { authorization: 'Bearer invalid-token' } };

    expect(() => {
      middleware.use(mockRequest as any, {} as any, mockNext);
    }).toThrow(UnauthorizedException);
  });
});