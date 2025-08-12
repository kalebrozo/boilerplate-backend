import { Test, TestingModule } from '@nestjs/testing';
import { ArgumentMetadata, BadRequestException } from '@nestjs/common';
import { SanitizationPipe } from './sanitization.pipe';
import { LoggerService } from '../logger/logger.service';

describe('SanitizationPipe', () => {
  let pipe: SanitizationPipe;
  let mockLoggerService: jest.Mocked<LoggerService>;

  beforeEach(async () => {
    mockLoggerService = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SanitizationPipe,
        {
          provide: LoggerService,
          useValue: mockLoggerService,
        },
      ],
    }).compile();

    pipe = module.get<SanitizationPipe>(SanitizationPipe);
  });

  it('should be defined', () => {
    expect(pipe).toBeDefined();
  });

  describe('transform', () => {
    const bodyMetadata: ArgumentMetadata = {
      type: 'body',
      metatype: class TestDto {},
      data: undefined,
    };

    const queryMetadata: ArgumentMetadata = {
      type: 'query',
      metatype: class TestDto {},
      data: undefined,
    };

    it('should sanitize body data', () => {
      const value = {
        name: '<script>alert("xss")</script>John Doe',
        email: 'john@example.com',
      };

      const result = pipe.transform(value, bodyMetadata);

      expect(result.name).not.toContain('<script>');
      expect(result.name).toContain('John Doe');
      expect(result.email).toBe('john@example.com');
    });

    it('should not sanitize non-body data', () => {
      const value = {
        search: '<script>alert("xss")</script>search term',
      };

      const result = pipe.transform(value, queryMetadata);

      expect(result).toEqual(value); // Should return unchanged
    });

    it('should handle null and undefined values', () => {
      expect(pipe.transform(null, bodyMetadata)).toBeNull();
      expect(pipe.transform(undefined, bodyMetadata)).toBeUndefined();
    });

    it('should sanitize nested objects', () => {
      const value = {
        user: {
          name: '<script>alert("xss")</script>John Doe',
          profile: {
            bio: '<iframe src="evil"></iframe>User bio',
          },
        },
      };

      const result = pipe.transform(value, bodyMetadata);

      expect(result.user.name).not.toContain('<script>');
      expect(result.user.name).toContain('John Doe');
      expect(result.user.profile.bio).not.toContain('<iframe>');
      expect(result.user.profile.bio).toContain('User bio');
    });

    it('should sanitize arrays', () => {
      const value = {
        tags: [
          '<script>alert("xss")</script>tag1',
          'normal tag',
          {
            name: '<iframe src="evil"></iframe>nested',
          },
        ],
      };

      const result = pipe.transform(value, bodyMetadata);

      expect(result.tags[0]).not.toContain('<script>');
      expect(result.tags[0]).toContain('tag1');
      expect(result.tags[1]).toBe('normal tag');
      expect(result.tags[2].name).not.toContain('<iframe>');
      expect(result.tags[2].name).toContain('nested');
    });

    it('should log warning when sanitization occurs', () => {
      const value = {
        name: '<script>alert("xss")</script>John Doe',
      };

      pipe.transform(value, bodyMetadata);

      expect(mockLoggerService.warn).toHaveBeenCalledWith(
        'Potentially dangerous content sanitized',
        {
          type: 'body',
          metatype: 'TestDto',
          originalLength: expect.any(Number),
          sanitizedLength: expect.any(Number),
        },
      );
    });

    it('should not log when no sanitization is needed', () => {
      const value = {
        name: 'John Doe',
        email: 'john@example.com',
      };

      pipe.transform(value, bodyMetadata);

      expect(mockLoggerService.warn).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException for dangerous content that cannot be sanitized', () => {
      // Mock sanitize to return a value that still contains suspicious content
      const value = {
        content: 'data:text/html,<script>alert("xss")</script>',
      };

      expect(() => {
        pipe.transform(value, bodyMetadata);
      }).toThrow(BadRequestException);
    });

    it('should handle various suspicious patterns', () => {
      const suspiciousValues = [
        'vbscript:alert("xss")',
        'livescript:alert("xss")',
        'eval("malicious code")',
        'Function("malicious code")',
        'setTimeout("malicious code")',
        'setInterval("malicious code")',
      ];

      suspiciousValues.forEach(suspiciousValue => {
        const value = { content: suspiciousValue };
        
        expect(() => {
          pipe.transform(value, bodyMetadata);
        }).toThrow(BadRequestException);
      });
    });

    it('should handle complex nested structures', () => {
      const value = {
        level1: {
          level2: {
            level3: {
              content: '<script>alert("deep xss")</script>Deep content',
              array: [
                '<iframe src="evil"></iframe>Array item',
                {
                  nested: '<svg onload=alert("nested")>Nested SVG</svg>',
                },
              ],
            },
          },
        },
      };

      const result = pipe.transform(value, bodyMetadata);

      expect(result.level1.level2.level3.content).not.toContain('<script>');
      expect(result.level1.level2.level3.content).toContain('Deep content');
      expect(result.level1.level2.level3.array[0]).not.toContain('<iframe>');
      expect(result.level1.level2.level3.array[0]).toContain('Array item');
      expect(result.level1.level2.level3.array[1].nested).not.toContain('onload');
      expect(result.level1.level2.level3.array[1].nested).toContain('Nested SVG');
    });

    it('should preserve non-string values', () => {
      const value = {
        name: '<script>alert("xss")</script>John Doe',
        age: 30,
        active: true,
        score: 95.5,
        tags: null,
        metadata: undefined,
        createdAt: new Date('2023-01-01'),
      };

      const result = pipe.transform(value, bodyMetadata);

      expect(result.name).not.toContain('<script>');
      expect(result.name).toContain('John Doe');
      expect(result.age).toBe(30);
      expect(result.active).toBe(true);
      expect(result.score).toBe(95.5);
      expect(result.tags).toBeNull();
      expect(result.metadata).toBeUndefined();
      expect(result.createdAt).toEqual(new Date('2023-01-01'));
    });

    it('should handle empty objects and arrays', () => {
      const value = {
        emptyObject: {},
        emptyArray: [],
        emptyString: '',
      };

      const result = pipe.transform(value, bodyMetadata);

      expect(result.emptyObject).toEqual({});
      expect(result.emptyArray).toEqual([]);
      expect(result.emptyString).toBe('');
    });
  });
});