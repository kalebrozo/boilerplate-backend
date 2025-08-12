import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of, throwError } from 'rxjs';
import { LoggingInterceptor } from './logging.interceptor';
import { LoggerService } from '../logger/logger.service';

describe('LoggingInterceptor', () => {
  let interceptor: LoggingInterceptor;
  let mockLoggerService: jest.Mocked<LoggerService>;
  let mockExecutionContext: jest.Mocked<ExecutionContext>;
  let mockCallHandler: jest.Mocked<CallHandler>;
  let mockRequest: any;
  let mockResponse: any;

  beforeEach(async () => {
    mockLoggerService = {
      debug: jest.fn(),
      logRequest: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    } as any;

    mockRequest = {
      method: 'GET',
      url: '/api/users',
      ip: '127.0.0.1',
      get: jest.fn().mockReturnValue('Mozilla/5.0'),
      user: { id: '123' },
      id: 'req-123',
      body: { name: 'Test User' },
      query: { page: '1' },
      params: { id: '123' },
    };

    mockResponse = {
      statusCode: 200,
    };

    mockExecutionContext = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue(mockRequest),
        getResponse: jest.fn().mockReturnValue(mockResponse),
      }),
    } as any;

    mockCallHandler = {
      handle: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoggingInterceptor,
        {
          provide: LoggerService,
          useValue: mockLoggerService,
        },
      ],
    }).compile();

    interceptor = module.get<LoggingInterceptor>(LoggingInterceptor);
  });

  it('should be defined', () => {
    expect(interceptor).toBeDefined();
  });

  describe('intercept', () => {
    it('should log incoming request and successful response', (done) => {
      const responseData = { id: '123', name: 'Test User' };
      mockCallHandler.handle.mockReturnValue(of(responseData));

      const result$ = interceptor.intercept(mockExecutionContext, mockCallHandler);

      result$.subscribe({
        next: (data) => {
          expect(data).toEqual(responseData);
          
          // Verifica se o log da requisição de entrada foi chamado
          expect(mockLoggerService.debug).toHaveBeenCalledWith(
            'Incoming request',
            {
              method: 'GET',
              url: '/api/users',
              ip: '127.0.0.1',
              userAgent: 'Mozilla/5.0',
              userId: '123',
              requestId: 'req-123',
              body: { name: 'Test User' },
              query: { page: '1' },
              params: { id: '123' },
            },
          );

          // Verifica se o log da resposta foi chamado
          expect(mockLoggerService.logRequest).toHaveBeenCalledWith(
            mockRequest,
            mockResponse,
            expect.any(Number),
          );

          done();
        },
        error: done,
      });
    });

    it('should log slow response warning', (done) => {
      const responseData = { id: '123', name: 'Test User' };
      mockCallHandler.handle.mockReturnValue(of(responseData));

      // Mock Date.now para simular resposta lenta
      const originalDateNow = Date.now;
      let callCount = 0;
      Date.now = jest.fn(() => {
        callCount++;
        if (callCount === 1) return 1000; // Início
        return 2500; // Fim (1500ms depois)
      });

      const result$ = interceptor.intercept(mockExecutionContext, mockCallHandler);

      result$.subscribe({
        next: () => {
          // Verifica se o warning de resposta lenta foi chamado
          expect(mockLoggerService.warn).toHaveBeenCalledWith(
            'Slow response detected',
            {
              method: 'GET',
              url: '/api/users',
              responseTime: 1500,
              userId: '123',
              requestId: 'req-123',
            },
          );

          // Restaura Date.now
          Date.now = originalDateNow;
          done();
        },
        error: done,
      });
    });

    it('should log error when request fails', (done) => {
      const error = new Error('Test error');
      error.name = 'TestError';
      (error as any).status = 500;
      (error as any).code = 'TEST_ERROR';
      
      mockCallHandler.handle.mockReturnValue(throwError(() => error));

      const result$ = interceptor.intercept(mockExecutionContext, mockCallHandler);

      result$.subscribe({
        next: () => {
          done(new Error('Should not reach here'));
        },
        error: (err) => {
          expect(err).toBe(error);
          
          // Verifica se o log de erro foi chamado
          expect(mockLoggerService.error).toHaveBeenCalledWith(
            'Request failed: Test error',
            error.stack,
            {
              method: 'GET',
              url: '/api/users',
              statusCode: 500,
              responseTime: expect.any(Number),
              ip: '127.0.0.1',
              userAgent: 'Mozilla/5.0',
              userId: '123',
              requestId: 'req-123',
              errorName: 'TestError',
              errorCode: 'TEST_ERROR',
            },
          );

          done();
        },
      });
    });
  });

  describe('sanitizeBody', () => {
    it('should redact sensitive fields', () => {
      const body = {
        name: 'Test User',
        password: 'secret123',
        token: 'abc123',
        secret: 'mysecret',
        key: 'mykey',
        authorization: 'Bearer token',
        cookie: 'session=123',
        session: 'session123',
        email: 'test@example.com',
      };

      const sanitized = (interceptor as any).sanitizeBody(body);

      expect(sanitized).toEqual({
        name: 'Test User',
        password: '[REDACTED]',
        token: '[REDACTED]',
        secret: '[REDACTED]',
        key: '[REDACTED]',
        authorization: '[REDACTED]',
        cookie: '[REDACTED]',
        session: '[REDACTED]',
        email: 'test@example.com',
      });
    });

    it('should return undefined for undefined body', () => {
      const result = (interceptor as any).sanitizeBody(undefined);
      expect(result).toBeUndefined();
    });

    it('should return null for null body', () => {
      const result = (interceptor as any).sanitizeBody(null);
      expect(result).toBeNull();
    });

    it('should handle body without sensitive fields', () => {
      const body = {
        name: 'Test User',
        email: 'test@example.com',
        age: 30,
      };

      const sanitized = (interceptor as any).sanitizeBody(body);

      expect(sanitized).toEqual(body);
    });
  });
});