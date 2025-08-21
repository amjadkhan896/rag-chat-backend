import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { ApiKeyMiddleware } from './api-key.middleware';

describe('ApiKeyMiddleware', () => {
  let middleware: ApiKeyMiddleware;
  let mockNext = jest.fn();

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        ApiKeyMiddleware,
        {
          provide: ConfigService,
          useValue: { get: () => 'correct-api-key' },
        },
      ],
    }).compile();

    middleware = module.get(ApiKeyMiddleware);
    mockNext.mockClear();
  });

  it('allows request with correct API key', () => {
    const mockRequest = { headers: { 'x-api-key': 'correct-api-key' } };
    const mockResponse = {};

    middleware.use(mockRequest as any, mockResponse as any, mockNext);

    expect(mockNext).toHaveBeenCalled();
  });

  it('rejects request with wrong API key', () => {
    const mockRequest = { headers: { 'x-api-key': 'wrong-key' } };
    const mockResponse = {};

    expect(() => {
      middleware.use(mockRequest as any, mockResponse as any, mockNext);
    }).toThrow(UnauthorizedException);
  });

  it('rejects request without API key', () => {
    const mockRequest = { headers: {} };
    const mockResponse = {};

    expect(() => {
      middleware.use(mockRequest as any, mockResponse as any, mockNext);
    }).toThrow(UnauthorizedException);
  });
});