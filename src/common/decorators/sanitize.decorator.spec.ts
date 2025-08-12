import { Transform, plainToClass } from 'class-transformer';
import { Sanitize, SanitizeArray, SanitizeNested } from './sanitize.decorator';

class TestDto {
  @Sanitize()
  name: string;

  @SanitizeArray()
  tags: string[];

  @SanitizeNested()
  metadata: any;

  normalField: string;
}

describe('Sanitize Decorators', () => {
  describe('@Sanitize', () => {
    it('should sanitize HTML tags from string', () => {
      const input = {
        name: '<script>alert("xss")</script>Hello World',
        normalField: 'normal text',
      };

      const result = plainToClass(TestDto, input);
      
      expect(result.name).not.toContain('<script>');
      expect(result.name).not.toContain('alert');
      expect(result.name).toContain('Hello World');
      expect(result.normalField).toBe('normal text');
    });

    it('should handle non-string values', () => {
      const input = {
        name: 123,
        normalField: 'normal text',
      };

      const result = plainToClass(TestDto, input);
      
      expect(result.name).toBe(123);
    });

    it('should handle null and undefined', () => {
      const input = {
        name: null,
        normalField: undefined,
      };

      const result = plainToClass(TestDto, input);
      
      expect(result.name).toBeNull();
      expect(result.normalField).toBeUndefined();
    });
  });

  describe('@SanitizeArray', () => {
    it('should sanitize array of strings', () => {
      const input = {
        tags: [
          '<script>alert("xss")</script>tag1',
          'normal tag',
          '<iframe src="evil"></iframe>tag2',
        ],
        normalField: 'normal text',
      };

      const result = plainToClass(TestDto, input);
      
      expect(result.tags).toHaveLength(3);
      expect(result.tags[0]).not.toContain('<script>');
      expect(result.tags[0]).toContain('tag1');
      expect(result.tags[1]).toBe('normal tag');
      expect(result.tags[2]).not.toContain('<iframe>');
      expect(result.tags[2]).toContain('tag2');
    });

    it('should handle mixed array types', () => {
      const input = {
        tags: [
          '<script>alert("xss")</script>tag1',
          123,
          null,
          { nested: 'object' },
        ],
        normalField: 'normal text',
      };

      const result = plainToClass(TestDto, input);
      
      expect(result.tags).toHaveLength(4);
      expect(result.tags[0]).not.toContain('<script>');
      expect(result.tags[1]).toBe(123);
      expect(result.tags[2]).toBeNull();
      expect(result.tags[3]).toEqual({ nested: 'object' });
    });

    it('should handle non-array values', () => {
      const input = {
        tags: 'not an array',
        normalField: 'normal text',
      };

      const result = plainToClass(TestDto, input);
      
      expect(result.tags).toBe('not an array');
    });
  });

  describe('@SanitizeNested', () => {
    it('should sanitize nested object strings', () => {
      const input = {
        metadata: {
          title: '<script>alert("xss")</script>Title',
          description: 'Normal description',
          count: 42,
          nested: {
            value: '<iframe src="evil"></iframe>Nested value',
          },
        },
        normalField: 'normal text',
      };

      const result = plainToClass(TestDto, input);
      
      expect(result.metadata.title).not.toContain('<script>');
      expect(result.metadata.title).toContain('Title');
      expect(result.metadata.description).toBe('Normal description');
      expect(result.metadata.count).toBe(42);
      // Note: SanitizeNested only sanitizes first level, not deeply nested
      expect(result.metadata.nested).toEqual({
        value: '<iframe src="evil"></iframe>Nested value',
      });
    });

    it('should handle non-object values', () => {
      const input = {
        metadata: 'not an object',
        normalField: 'normal text',
      };

      const result = plainToClass(TestDto, input);
      
      expect(result.metadata).toBe('not an object');
    });

    it('should handle arrays', () => {
      const input = {
        metadata: ['array', 'value'],
        normalField: 'normal text',
      };

      const result = plainToClass(TestDto, input);
      
      expect(result.metadata).toEqual(['array', 'value']);
    });

    it('should handle null and undefined', () => {
      const input = {
        metadata: null,
        normalField: 'normal text',
      };

      const result = plainToClass(TestDto, input);
      
      expect(result.metadata).toBeNull();
    });
  });

  describe('Real-world scenarios', () => {
    it('should handle complex XSS attempts', () => {
      const input = {
        name: '<img src=x onerror=alert("XSS")>',
        tags: [
          'javascript:alert("XSS")',
          '<svg onload=alert("XSS")>',
          'normal tag',
        ],
        metadata: {
          bio: '<script>document.cookie</script>User bio',
          website: 'javascript:void(0)',
        },
        normalField: 'normal text',
      };

      const result = plainToClass(TestDto, input);
      
      expect(result.name).not.toContain('onerror');
      expect(result.name).not.toContain('alert');
      expect(result.tags[0]).not.toContain('javascript:');
      expect(result.tags[1]).not.toContain('onload');
      expect(result.tags[2]).toBe('normal tag');
      expect(result.metadata.bio).not.toContain('<script>');
      expect(result.metadata.bio).toContain('User bio');
    });
  });
});