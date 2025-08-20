import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import { AuthMiddleware } from './auth.middleware';

// Mock jsonwebtoken
jest.mock('jsonwebtoken');
const mockedJwt = jwt as jest.Mocked<typeof jwt>;

describe('AuthMiddleware', () => {
  let middleware: AuthMiddleware;
  let configService: ConfigService;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthMiddleware,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    middleware = module.get<AuthMiddleware>(AuthMiddleware);
    configService = module.get<ConfigService>(ConfigService);

    mockRequest = {
      headers: {},
      user: undefined,
    };
    mockResponse = {};
    mockNext = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('use', () => {
    it('should set user in request when valid JWT token is provided', () => {
      const jwtSecret = 'test-secret';
      const userId = 'user123';
      const token = 'valid.jwt.token';
      const decodedToken = { userId, sub: userId, id: userId };

      jest.spyOn(configService, 'get').mockReturnValue(jwtSecret);
      mockedJwt.verify.mockReturnValue(decodedToken as any);
      mockRequest.headers = { authorization: `Bearer ${token}` };

      middleware.use(mockRequest as Request, mockResponse as Response, mockNext);

      expect(configService.get).toHaveBeenCalledWith('JWT_SECRET');
      expect(jwt.verify).toHaveBeenCalledWith(token, jwtSecret);
      expect(mockRequest.user).toEqual({ id: userId });
      expect(mockNext).toHaveBeenCalled();
    });

    it('should prioritize id over userId and sub in token', () => {
      const jwtSecret = 'test-secret';
      const token = 'valid.jwt.token';
      const decodedToken = { id: 'id789', userId: 'user123', sub: 'sub456' };

      jest.spyOn(configService, 'get').mockReturnValue(jwtSecret);
      mockedJwt.verify.mockReturnValue(decodedToken as any);
      mockRequest.headers = { authorization: `Bearer ${token}` };

      middleware.use(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockRequest.user).toEqual({ id: 'id789' });
    });

    it('should use userId when id is not present', () => {
      const jwtSecret = 'test-secret';
      const token = 'valid.jwt.token';
      const decodedToken = { userId: 'user123', sub: 'sub456' };

      jest.spyOn(configService, 'get').mockReturnValue(jwtSecret);
      mockedJwt.verify.mockReturnValue(decodedToken as any);
      mockRequest.headers = { authorization: `Bearer ${token}` };

      middleware.use(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockRequest.user).toEqual({ id: 'user123' });
    });

    it('should use sub when id and userId are not present', () => {
      const jwtSecret = 'test-secret';
      const token = 'valid.jwt.token';
      const decodedToken = { sub: 'sub456' };

      jest.spyOn(configService, 'get').mockReturnValue(jwtSecret);
      mockedJwt.verify.mockReturnValue(decodedToken as any);
      mockRequest.headers = { authorization: `Bearer ${token}` };

      middleware.use(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockRequest.user).toEqual({ id: 'sub456' });
    });

    it('should use id when userId and sub are not present', () => {
      const jwtSecret = 'test-secret';
      const token = 'valid.jwt.token';
      const decodedToken = { id: 'id789' };

      jest.spyOn(configService, 'get').mockReturnValue(jwtSecret);
      mockedJwt.verify.mockReturnValue(decodedToken as any);
      mockRequest.headers = { authorization: `Bearer ${token}` };

      middleware.use(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockRequest.user).toEqual({ id: 'id789' });
    });

    it('should throw UnauthorizedException when Authorization header is missing', () => {
      mockRequest.headers = {};

      expect(() => {
        middleware.use(mockRequest as Request, mockResponse as Response, mockNext);
      }).toThrow(new UnauthorizedException('Missing Authorization header'));

      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when Authorization header does not start with Bearer', () => {
      mockRequest.headers = { authorization: 'Basic token123' };

      expect(() => {
        middleware.use(mockRequest as Request, mockResponse as Response, mockNext);
      }).toThrow(new UnauthorizedException('Invalid Authorization header format'));

      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when JWT secret is not configured', () => {
      jest.spyOn(configService, 'get').mockReturnValue(undefined);
      mockRequest.headers = { authorization: 'Bearer token123' };

      expect(() => {
        middleware.use(mockRequest as Request, mockResponse as Response, mockNext);
      }).toThrow(new UnauthorizedException('JWT_SECRET is not configured'));

      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when JWT verification fails', () => {
      const jwtSecret = 'test-secret';
      jest.spyOn(configService, 'get').mockReturnValue(jwtSecret);
      mockedJwt.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });
      mockRequest.headers = { authorization: 'Bearer invalid.token' };

      expect(() => {
        middleware.use(mockRequest as Request, mockResponse as Response, mockNext);
      }).toThrow(UnauthorizedException);

      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when no user identifier is found in token', () => {
      const jwtSecret = 'test-secret';
      const token = 'valid.jwt.token';
      const decodedToken = { someOtherField: 'value' };

      jest.spyOn(configService, 'get').mockReturnValue(jwtSecret);
      mockedJwt.verify.mockReturnValue(decodedToken as any);
      mockRequest.headers = { authorization: `Bearer ${token}` };

      expect(() => {
        middleware.use(mockRequest as Request, mockResponse as Response, mockNext);
      }).toThrow(new UnauthorizedException('Token does not include a valid user id'));

      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});
