import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ApiKeyMiddleware } from './api-key.middleware';

describe('ApiKeyMiddleware', () => {
  let middleware: ApiKeyMiddleware;
  let configService: ConfigService;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApiKeyMiddleware,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    middleware = module.get<ApiKeyMiddleware>(ApiKeyMiddleware);
    configService = module.get<ConfigService>(ConfigService);

    mockRequest = {
      headers: {},
    };
    mockResponse = {};
    mockNext = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('use', () => {
    it('should call next() when API key is valid', () => {
      const validApiKey = 'test-api-key';
      jest.spyOn(configService, 'get').mockReturnValue(validApiKey);
      mockRequest.headers = { 'x-api-key': validApiKey };

      middleware.use(mockRequest as Request, mockResponse as Response, mockNext);

      expect(configService.get).toHaveBeenCalledWith('X_API_KEY');
      expect(mockNext).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when API key configuration is missing', () => {
      jest.spyOn(configService, 'get').mockReturnValue(undefined);
      mockRequest.headers = { 'x-api-key': 'some-key' };

      expect(() => {
        middleware.use(mockRequest as Request, mockResponse as Response, mockNext);
      }).toThrow(new UnauthorizedException('API key configuration is missing'));

      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when x-api-key header is missing', () => {
      jest.spyOn(configService, 'get').mockReturnValue('valid-key');
      mockRequest.headers = {};

      expect(() => {
        middleware.use(mockRequest as Request, mockResponse as Response, mockNext);
      }).toThrow(new UnauthorizedException('API key is required'));

      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when API key is invalid', () => {
      const validApiKey = 'valid-key';
      const invalidApiKey = 'invalid-key';

      jest.spyOn(configService, 'get').mockReturnValue(validApiKey);
      mockRequest.headers = { 'x-api-key': invalidApiKey };

      expect(() => {
        middleware.use(mockRequest as Request, mockResponse as Response, mockNext);
      }).toThrow(new UnauthorizedException('Invalid API key'));

      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when x-api-key header is an array', () => {
      const validApiKey = 'valid-key';
      jest.spyOn(configService, 'get').mockReturnValue(validApiKey);
      mockRequest.headers = { 'x-api-key': [validApiKey, 'another-key'] as any };

      expect(() => {
        middleware.use(mockRequest as Request, mockResponse as Response, mockNext);
      }).toThrow(new UnauthorizedException('Invalid API key'));

      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});
