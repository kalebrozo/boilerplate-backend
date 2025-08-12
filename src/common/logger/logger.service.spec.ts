import { Test, TestingModule } from '@nestjs/testing';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { LoggerService } from './logger.service';
import { Logger } from 'winston';

describe('LoggerService', () => {
  let service: LoggerService;
  let mockWinstonLogger: jest.Mocked<Logger>;

  beforeEach(async () => {
    mockWinstonLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      verbose: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoggerService,
        {
          provide: WINSTON_MODULE_PROVIDER,
          useValue: mockWinstonLogger,
        },
      ],
    }).compile();

    service = module.get<LoggerService>(LoggerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('log methods', () => {
    it('should call winston info for log method', () => {
      const message = 'Test message';
      const context = 'TestContext';

      service.log(message, context);

      expect(mockWinstonLogger.info).toHaveBeenCalledWith(message, {
        context,
      });
    });

    it('should call winston info for info method', () => {
      const message = 'Test info message';
      const context = { userId: '123' };

      service.info(message, context);

      expect(mockWinstonLogger.info).toHaveBeenCalledWith(message, context);
    });

    it('should call winston error for error method', () => {
      const message = 'Test error message';
      const trace = 'Error stack trace';
      const context = { userId: '123' };

      service.error(message, trace, context);

      expect(mockWinstonLogger.error).toHaveBeenCalledWith(message, {
        ...context,
        stack: trace,
      });
    });

    it('should call winston warn for warn method', () => {
      const message = 'Test warning message';
      const context = { userId: '123' };

      service.warn(message, context);

      expect(mockWinstonLogger.warn).toHaveBeenCalledWith(message, context);
    });

    it('should call winston debug for debug method', () => {
      const message = 'Test debug message';
      const context = { userId: '123' };

      service.debug(message, context);

      expect(mockWinstonLogger.debug).toHaveBeenCalledWith(message, context);
    });
  });

  describe('logRequest', () => {
    it('should log successful request with info level', () => {
      const req = {
        method: 'GET',
        url: '/api/users',
        ip: '127.0.0.1',
        get: jest.fn().mockReturnValue('Mozilla/5.0'),
        user: { id: '123' },
        id: 'req-123',
      };
      const res = { statusCode: 200 };
      const responseTime = 150;

      service.logRequest(req, res, responseTime);

      expect(mockWinstonLogger.info).toHaveBeenCalledWith(
        'GET /api/users 200 - 150ms',
        {
          method: 'GET',
          url: '/api/users',
          statusCode: 200,
          responseTime: 150,
          ip: '127.0.0.1',
          userAgent: 'Mozilla/5.0',
          userId: '123',
          requestId: 'req-123',
        },
      );
    });

    it('should log error request with warn level', () => {
      const req = {
        method: 'POST',
        url: '/api/users',
        ip: '127.0.0.1',
        get: jest.fn().mockReturnValue('Mozilla/5.0'),
        user: { id: '123' },
        id: 'req-123',
      };
      const res = { statusCode: 400 };
      const responseTime = 50;

      service.logRequest(req, res, responseTime);

      expect(mockWinstonLogger.warn).toHaveBeenCalledWith(
        'POST /api/users 400 - 50ms',
        {
          method: 'POST',
          url: '/api/users',
          statusCode: 400,
          responseTime: 50,
          ip: '127.0.0.1',
          userAgent: 'Mozilla/5.0',
          userId: '123',
          requestId: 'req-123',
        },
      );
    });
  });

  describe('logAuthentication', () => {
    it('should log successful authentication with info level', () => {
      const userId = '123';
      const action = 'login';
      const success = true;
      const context = { ip: '127.0.0.1' };

      service.logAuthentication(userId, action, success, context);

      expect(mockWinstonLogger.info).toHaveBeenCalledWith(
        'Authentication login successful for user 123',
        {
          ip: '127.0.0.1',
          userId: '123',
          action: 'login',
          success: true,
          type: 'authentication',
        },
      );
    });

    it('should log failed authentication with warn level', () => {
      const userId = '123';
      const action = 'login';
      const success = false;
      const context = { ip: '127.0.0.1' };

      service.logAuthentication(userId, action, success, context);

      expect(mockWinstonLogger.warn).toHaveBeenCalledWith(
        'Authentication login failed for user 123',
        {
          ip: '127.0.0.1',
          userId: '123',
          action: 'login',
          success: false,
          type: 'authentication',
        },
      );
    });
  });

  describe('logSecurityEvent', () => {
    it('should log high severity security event with error level', () => {
      const event = 'Suspicious login attempt';
      const severity = 'high' as const;
      const context = { ip: '127.0.0.1' };

      service.logSecurityEvent(event, severity, context);

      expect(mockWinstonLogger.error).toHaveBeenCalledWith(
        'Security event: Suspicious login attempt',
        {
          type: 'security',
          event: 'Suspicious login attempt',
          severity: 'high',
          ip: '127.0.0.1',
          stack: undefined,
        },
      );
    });

    it('should log medium severity security event with warn level', () => {
      const event = 'Multiple failed login attempts';
      const severity = 'medium' as const;
      const context = { ip: '127.0.0.1' };

      service.logSecurityEvent(event, severity, context);

      expect(mockWinstonLogger.warn).toHaveBeenCalledWith(
        'Security event: Multiple failed login attempts',
        {
          ip: '127.0.0.1',
          event: 'Multiple failed login attempts',
          severity: 'medium',
          type: 'security',
        },
      );
    });

    it('should log low severity security event with info level', () => {
      const event = 'User password changed';
      const severity = 'low' as const;
      const context = { userId: '123' };

      service.logSecurityEvent(event, severity, context);

      expect(mockWinstonLogger.info).toHaveBeenCalledWith(
        'Security event: User password changed',
        {
          userId: '123',
          event: 'User password changed',
          severity: 'low',
          type: 'security',
        },
      );
    });
  });

  describe('formatContext', () => {
    it('should format string context correctly', () => {
      const result = (service as any).formatContext('TestContext');
      expect(result).toEqual({ context: 'TestContext' });
    });

    it('should return object context as is', () => {
      const context = { userId: '123', action: 'test' };
      const result = (service as any).formatContext(context);
      expect(result).toEqual(context);
    });

    it('should return empty object for undefined context', () => {
      const result = (service as any).formatContext(undefined);
      expect(result).toEqual({});
    });
  });
});