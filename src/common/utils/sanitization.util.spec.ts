import { SanitizationUtil } from './sanitization.util';

describe('SanitizationUtil', () => {
  describe('sanitizeString', () => {
    it('should sanitize HTML tags', () => {
      const input = '<script>alert("xss")</script>Hello World';
      const result = SanitizationUtil.sanitizeString(input);
      
      expect(result).not.toContain('<script>');
      expect(result).not.toContain('alert');
      expect(result).toContain('Hello World');
    });

    it('should handle non-string input', () => {
      expect(SanitizationUtil.sanitizeString(123 as any)).toBe(123);
      expect(SanitizationUtil.sanitizeString(null as any)).toBeNull();
      expect(SanitizationUtil.sanitizeString(undefined as any)).toBeUndefined();
    });
  });

  describe('sanitizeEmail', () => {
    it('should sanitize email while preserving format', () => {
      const input = 'user<script>@example.com';
      const result = SanitizationUtil.sanitizeEmail(input);
      
      expect(result).not.toContain('<script>');
      expect(result).toContain('@example.com');
    });

    it('should remove dangerous protocols', () => {
      const input = 'javascript:alert("xss")@example.com';
      const result = SanitizationUtil.sanitizeEmail(input);
      
      expect(result).not.toContain('javascript:');
      expect(result).toContain('@example.com');
    });

    it('should handle normal emails', () => {
      const input = 'user@example.com';
      const result = SanitizationUtil.sanitizeEmail(input);
      
      expect(result).toBe('user@example.com');
    });

    it('should handle non-string input', () => {
      expect(SanitizationUtil.sanitizeEmail(123 as any)).toBe(123);
    });
  });

  describe('sanitizeUrl', () => {
    it('should allow safe protocols', () => {
      const urls = [
        'https://example.com',
        'http://example.com',
        'ftp://files.example.com',
        'mailto:user@example.com',
      ];

      urls.forEach(url => {
        const result = SanitizationUtil.sanitizeUrl(url);
        expect(result).toBe(url);
      });
    });

    it('should block dangerous protocols', () => {
      const dangerousUrls = [
        'javascript:alert("xss")',
        'data:text/html,<script>alert("xss")</script>',
        'vbscript:alert("xss")',
      ];

      dangerousUrls.forEach(url => {
        const result = SanitizationUtil.sanitizeUrl(url);
        expect(result).toBe('');
      });
    });

    it('should handle invalid URLs', () => {
      const input = 'not-a-valid-url<script>alert("xss")</script>';
      const result = SanitizationUtil.sanitizeUrl(input);
      
      expect(result).not.toContain('<script>');
    });

    it('should handle non-string input', () => {
      expect(SanitizationUtil.sanitizeUrl(123 as any)).toBe(123);
    });
  });

  describe('sanitizeMarkdown', () => {
    it('should remove dangerous tags but preserve markdown', () => {
      const input = '# Title\n\n<script>alert("xss")</script>\n\n**Bold text**';
      const result = SanitizationUtil.sanitizeMarkdown(input);
      
      expect(result).not.toContain('<script>');
      expect(result).toContain('# Title');
      expect(result).toContain('**Bold text**');
    });

    it('should remove various dangerous elements', () => {
      const input = `
        <iframe src="evil"></iframe>
        <object data="evil"></object>
        <embed src="evil">
        javascript:alert("xss")
        <div onload="alert('xss')">Content</div>
      `;
      const result = SanitizationUtil.sanitizeMarkdown(input);
      
      expect(result).not.toContain('<iframe>');
      expect(result).not.toContain('<object>');
      expect(result).not.toContain('<embed>');
      expect(result).not.toContain('javascript:');
      expect(result).not.toContain('onload');
      expect(result).toContain('Content');
    });

    it('should handle non-string input', () => {
      expect(SanitizationUtil.sanitizeMarkdown(123 as any)).toBe(123);
    });
  });

  describe('sanitizeObject', () => {
    it('should sanitize object recursively', () => {
      const input = {
        name: '<script>alert("xss")</script>John Doe',
        bio: '<iframe src="evil"></iframe>User bio',
        nested: {
          content: '<svg onload=alert("xss")>Content</svg>',
        },
        tags: [
          '<script>tag1</script>',
          'normal tag',
        ],
      };

      const result = SanitizationUtil.sanitizeObject(input);

      expect(result.name).not.toContain('<script>');
      expect(result.name).toContain('John Doe');
      expect(result.bio).not.toContain('<iframe>');
      expect(result.bio).toContain('User bio');
      expect(result.nested.content).not.toContain('onload');
      expect(result.nested.content).toContain('Content');
      expect(result.tags[0]).not.toContain('<script>');
      expect(result.tags[0]).toContain('tag1');
      expect(result.tags[1]).toBe('normal tag');
    });

    it('should skip sensitive fields', () => {
      const input = {
        name: '<script>alert("xss")</script>John Doe',
        password: '<script>alert("password")</script>secret123',
        token: '<script>alert("token")</script>abc123',
      };

      const result = SanitizationUtil.sanitizeObject(input);

      expect(result.name).not.toContain('<script>');
      expect(result.password).toBe('<script>alert("password")</script>secret123');
      expect(result.token).toBe('<script>alert("token")</script>abc123');
    });

    it('should handle email fields specially', () => {
      const input = {
        email: 'user<script>@example.com',
        contactEmail: 'contact<iframe>@example.com',
        name: '<script>John Doe</script>',
      };

      const result = SanitizationUtil.sanitizeObject(input);

      expect(result.email).not.toContain('<script>');
      expect(result.email).toContain('@example.com');
      expect(result.contactEmail).not.toContain('<iframe>');
      expect(result.contactEmail).toContain('@example.com');
      expect(result.name).not.toContain('<script>');
      expect(result.name).toContain('John Doe');
    });

    it('should handle URL fields specially', () => {
      const input = {
        url: 'https://example.com<script>',
        website: 'javascript:alert("xss")',
        link: 'http://safe.com',
        name: '<script>John Doe</script>',
      };

      const result = SanitizationUtil.sanitizeObject(input);

      expect(result.url).not.toContain('<script>');
      expect(result.url).toContain('https://example.com');
      expect(result.website).toBe(''); // Dangerous protocol blocked
      expect(result.link).toBe('http://safe.com');
      expect(result.name).not.toContain('<script>');
    });

    it('should handle markdown fields specially', () => {
      const input = {
        description: '# Title\n<script>alert("xss")</script>\n**Bold**',
        content: '<iframe src="evil"></iframe>Content here',
        bio: '## Bio\n<object data="evil"></object>User bio',
        name: '<script>John Doe</script>',
      };

      const result = SanitizationUtil.sanitizeObject(input);

      expect(result.description).not.toContain('<script>');
      expect(result.description).toContain('# Title');
      expect(result.description).toContain('**Bold**');
      expect(result.content).not.toContain('<iframe>');
      expect(result.content).toContain('Content here');
      expect(result.bio).not.toContain('<object>');
      expect(result.bio).toContain('## Bio');
      expect(result.name).not.toContain('<script>');
    });

    it('should handle custom options', () => {
      const input = {
        customSensitive: '<script>sensitive</script>',
        customEmail: 'user<script>@example.com',
        name: '<script>John Doe</script>',
      };

      const options = {
        skipFields: ['customSensitive'],
        emailFields: ['customEmail'],
      };

      const result = SanitizationUtil.sanitizeObject(input, options);

      expect(result.customSensitive).toBe('<script>sensitive</script>');
      expect(result.customEmail).not.toContain('<script>');
      expect(result.customEmail).toContain('@example.com');
      expect(result.name).not.toContain('<script>');
    });

    it('should handle null and undefined', () => {
      expect(SanitizationUtil.sanitizeObject(null)).toBeNull();
      expect(SanitizationUtil.sanitizeObject(undefined)).toBeUndefined();
    });

    it('should handle arrays', () => {
      const input = [
        '<script>item1</script>',
        'normal item',
        {
          name: '<iframe>nested</iframe>',
        },
      ];

      const result = SanitizationUtil.sanitizeObject(input);

      expect(result[0]).not.toContain('<script>');
      expect(result[0]).toContain('item1');
      expect(result[1]).toBe('normal item');
      expect(result[2].name).not.toContain('<iframe>');
      expect(result[2].name).toContain('nested');
    });
  });

  describe('containsDangerousContent', () => {
    it('should detect dangerous patterns', () => {
      const dangerousInputs = [
        '<script>alert("xss")</script>',
        '<iframe src="evil"></iframe>',
        'javascript:alert("xss")',
        'vbscript:alert("xss")',
        'data:text/html,<script>',
        '<div onload="alert()">',
        '<object data="evil"></object>',
        '<embed src="evil">',
        'eval("malicious")',
        'Function("malicious")',
      ];

      dangerousInputs.forEach(input => {
        expect(SanitizationUtil.containsDangerousContent(input)).toBe(true);
      });
    });

    it('should not flag safe content', () => {
      const safeInputs = [
        'Hello World',
        '<p>Safe HTML</p>',
        'https://example.com',
        'user@example.com',
        '# Markdown Title',
      ];

      safeInputs.forEach(input => {
        expect(SanitizationUtil.containsDangerousContent(input)).toBe(false);
      });
    });

    it('should handle non-string input', () => {
      expect(SanitizationUtil.containsDangerousContent(123 as any)).toBe(false);
      expect(SanitizationUtil.containsDangerousContent(null as any)).toBe(false);
    });
  });

  describe('stripHtml', () => {
    it('should remove all HTML tags', () => {
      const input = '<p>Hello <strong>World</strong></p><script>alert("xss")</script>';
      const result = SanitizationUtil.stripHtml(input);
      
      expect(result).toBe('Hello World');
      expect(result).not.toContain('<');
      expect(result).not.toContain('>');
    });

    it('should handle text without HTML', () => {
      const input = 'Plain text content';
      const result = SanitizationUtil.stripHtml(input);
      
      expect(result).toBe('Plain text content');
    });

    it('should handle non-string input', () => {
      expect(SanitizationUtil.stripHtml(123 as any)).toBe(123);
    });
  });

  describe('escapeHtml', () => {
    it('should escape HTML special characters', () => {
      const input = '<script>alert("XSS") & \'test\'</script>';
      const result = SanitizationUtil.escapeHtml(input);
      
      expect(result).toBe('&lt;script&gt;alert(&quot;XSS&quot;) &amp; &#x27;test&#x27;&lt;&#x2F;script&gt;');
    });

    it('should handle text without special characters', () => {
      const input = 'Plain text content';
      const result = SanitizationUtil.escapeHtml(input);
      
      expect(result).toBe('Plain text content');
    });

    it('should handle non-string input', () => {
      expect(SanitizationUtil.escapeHtml(123 as any)).toBe(123);
    });
  });
});