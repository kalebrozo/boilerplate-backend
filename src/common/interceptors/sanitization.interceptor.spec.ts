import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of } from 'rxjs';
import { SanitizationInterceptor } from './sanitization.interceptor';
import { LoggerService } from '../logger/logger.service';

describe('SanitizationInterceptor', () => {
  let interceptor: SanitizationInterceptor;
  let mockLoggerService: jest.Mocked<LoggerService>;
  let mockExecutionContext: jest.Mocked<ExecutionContext>;
  let mockCallHandler: jest.Mocked<CallHandler>;
  let mockRequest: any;

  beforeEach(async () => {
    mockLoggerService = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    } as any;

    mockRequest = {
      method: 'POST',
      url: '/api/users',
      user: { id: '123' },
      id: 'req-123',
      body: {},
      query: {},
      params: {},
    };

    mockExecutionContext = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue(mockRequest),
      }),
    } as any;

    mockCallHandler = {
      handle: jest.fn().mockReturnValue(of('response')),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SanitizationInterceptor,
        {
          provide: LoggerService,
          useValue: mockLoggerService,
        },
      ],
    }).compile();

    interceptor = module.get<SanitizationInterceptor>(SanitizationInterceptor);
  });

  it('should be defined', () => {
    expect(interceptor).toBeDefined();
  });

  describe('intercept', () => {
    it('should sanitize request body', async () => {
      mockRequest.body = {
        name: '<script>alert("xss")</script>John Doe',
        email: 'john@example.com',
        bio: '<iframe src="evil"></iframe>User bio',
      };

      const result$ = interceptor.intercept(mockExecutionContext, mockCallHandler);

      await result$.toPromise();
      
      expect(mockRequest.body.name).not.toContain('<script>');
      expect(mockRequest.body.name).toContain('John Doe');
      expect(mockRequest.body.email).toBe('john@example.com');
      expect(mockRequest.body.bio).not.toContain('<iframe>');
      expect(mockRequest.body.bio).toContain('User bio');
      
      expect(mockLoggerService.debug).toHaveBeenCalledWith(
        'Request data sanitized',
        {
          method: 'POST',
          url: '/api/users',
          userId: '123',
          requestId: 'req-123',
        },
      );
    });

    it('should sanitize query parameters', async () => {
      mockRequest.query = {
        search: '<script>alert("xss")</script>search term',
        filter: 'normal filter',
      };

      const result$ = interceptor.intercept(mockExecutionContext, mockCallHandler);

      await result$.toPromise();
      
      expect(mockRequest.query.search).not.toContain('<script>');
      expect(mockRequest.query.search).toContain('search term');
      expect(mockRequest.query.filter).toBe('normal filter');
    });

    it('should sanitize route parameters', async () => {
      mockRequest.params = {
        id: '<script>alert("xss")</script>123',
        slug: 'normal-slug',
      };

      const result$ = interceptor.intercept(mockExecutionContext, mockCallHandler);

      await result$.toPromise();
      
      expect(mockRequest.params.id).not.toContain('<script>');
      expect(mockRequest.params.id).toContain('123');
      expect(mockRequest.params.slug).toBe('normal-slug');
    });

    it('should preserve sensitive fields without sanitization', async () => {
      mockRequest.body = {
        name: '<script>alert("xss")</script>John Doe',
        password: '<script>alert("password")</script>secret123',
        token: '<script>alert("token")</script>abc123',
        secret: '<script>alert("secret")</script>mysecret',
      };

      const result$ = interceptor.intercept(mockExecutionContext, mockCallHandler);

      await result$.toPromise();
      
      expect(mockRequest.body.name).not.toContain('<script>');
      expect(mockRequest.body.name).toContain('John Doe');
      
      // Sensitive fields should be preserved for validation
      expect(mockRequest.body.password).toBe('<script>alert("password")</script>secret123');
      expect(mockRequest.body.token).toBe('<script>alert("token")</script>abc123');
      expect(mockRequest.body.secret).toBe('<script>alert("secret")</script>mysecret');
    });

    it('should handle nested objects', async () => {
      mockRequest.body = {
        user: {
          name: '<script>alert("xss")</script>John Doe',
          profile: {
            bio: '<iframe src="evil"></iframe>User bio',
            website: 'https://example.com',
          },
        },
        metadata: {
          tags: [
            '<script>alert("tag")</script>tag1',
            'normal tag',
          ],
        },
      };

      const result$ = interceptor.intercept(mockExecutionContext, mockCallHandler);

      await result$.toPromise();
      
      expect(mockRequest.body.user.name).not.toContain('<script>');
      expect(mockRequest.body.user.name).toContain('John Doe');
      expect(mockRequest.body.user.profile.bio).not.toContain('<iframe>');
      expect(mockRequest.body.user.profile.bio).toContain('User bio');
      expect(mockRequest.body.user.profile.website).toBe('https://example.com');
      expect(mockRequest.body.metadata.tags[0]).not.toContain('<script>');
      expect(mockRequest.body.metadata.tags[0]).toContain('tag1');
      expect(mockRequest.body.metadata.tags[1]).toBe('normal tag');
    });

    it('should handle arrays', async () => {
      mockRequest.body = {
        items: [
          '<script>alert("xss")</script>item1',
          'normal item',
          {
            name: '<iframe src="evil"></iframe>nested item',
            value: 42,
          },
        ],
      };

      const result$ = interceptor.intercept(mockExecutionContext, mockCallHandler);

      await result$.toPromise();
      
      expect(mockRequest.body.items[0]).not.toContain('<script>');
      expect(mockRequest.body.items[0]).toContain('item1');
      expect(mockRequest.body.items[1]).toBe('normal item');
      expect(mockRequest.body.items[2].name).not.toContain('<iframe>');
      expect(mockRequest.body.items[2].name).toContain('nested item');
      expect(mockRequest.body.items[2].value).toBe(42);
    });

    it('should handle null and undefined values', async () => {
      mockRequest.body = {
        nullValue: null,
        undefinedValue: undefined,
        emptyString: '',
        zeroValue: 0,
        falseValue: false,
      };

      const result$ = interceptor.intercept(mockExecutionContext, mockCallHandler);

      await result$.toPromise();
      
      expect(mockRequest.body.nullValue).toBeNull();
      expect(mockRequest.body.undefinedValue).toBeUndefined();
      expect(mockRequest.body.emptyString).toBe('');
      expect(mockRequest.body.zeroValue).toBe(0);
      expect(mockRequest.body.falseValue).toBe(false);
    });

    it('should handle empty request data', async () => {
      mockRequest.body = null;
      mockRequest.query = null;
      mockRequest.params = null;

      const result$ = interceptor.intercept(mockExecutionContext, mockCallHandler);

      await result$.toPromise();
      
      expect(mockRequest.body).toBeNull();
      expect(mockRequest.query).toBeNull();
      expect(mockRequest.params).toBeNull();
      
      expect(mockLoggerService.debug).toHaveBeenCalledWith(
        'Request data sanitized',
        {
          method: 'POST',
          url: '/api/users',
          userId: '123',
          requestId: 'req-123',
        },
      );
    });

    it('should handle complex XSS attempts', async () => {
      mockRequest.body = {
        content: '<img src=x onerror=alert("XSS")>',
        description: 'javascript:alert("XSS")',
        title: '<svg onload=alert("XSS")>Title</svg>',
        url: '<script>document.cookie</script>',
      };

      const result$ = interceptor.intercept(mockExecutionContext, mockCallHandler);

      await result$.toPromise();
      
      expect(mockRequest.body.content).not.toContain('onerror');
      expect(mockRequest.body.content).not.toContain('alert');
      expect(mockRequest.body.description).not.toContain('javascript:');
      expect(mockRequest.body.title).not.toContain('onload');
      expect(mockRequest.body.title).toContain('Title');
      expect(mockRequest.body.url).not.toContain('<script>');
    });
  });
});