/**
 * Utilitário para sanitização avançada de dados
 */
export class SanitizationUtil {
  /**
   * Sanitiza uma string removendo HTML e scripts perigosos
   */
  static sanitizeString(input: string): string {
    if (typeof input !== 'string') {
      return input;
    }
    
    // Para sanitização de strings, extraímos texto seguro de scripts e removemos código perigoso
    let result = input
      // Extrai conteúdo de scripts que não seja código JavaScript
      .replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, (match, content) => {
        // Se o conteúdo parece ser código JavaScript, remove tudo
        if (/\b(alert|eval|function|var|let|const|if|for|while)\b/i.test(content)) {
          return '';
        }
        // Caso contrário, preserva o conteúdo
        return content;
      })
      // Remove completamente styles e seus conteúdos
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      // Remove apenas as tags HTML, preservando o conteúdo
      .replace(/<\/?[^>]+(>|$)/g, '')
      // Remove javascript: URLs
      .replace(/javascript:/gi, '')
      // Remove eventos on*
      .replace(/\son\w+\s*=\s*["'][^"']*["']/gi, '')
      // Remove múltiplos espaços
      .replace(/\s+/g, ' ')
      .trim();
      
    return result;
  }

  /**
   * Sanitiza um email removendo caracteres perigosos mas mantendo formato válido
   */
  static sanitizeEmail(email: string): string {
    if (typeof email !== 'string') {
      return email;
    }
    
    // Remove caracteres perigosos mas mantém @ e . para emails
    return email
      .replace(/[<>"']/g, '')
      .replace(/javascript:/gi, '')
      .replace(/data:/gi, '')
      .trim();
  }

  /**
   * Sanitiza URLs removendo protocolos perigosos
   */
  static sanitizeUrl(url: string): string {
    if (typeof url !== 'string') {
      return url;
    }

    // Lista de protocolos permitidos
    const allowedProtocols = ['http:', 'https:', 'ftp:', 'mailto:'];
    
    try {
      const urlObj = new URL(url);
      
      if (!allowedProtocols.includes(urlObj.protocol)) {
        return '';
      }
      
      return this.stripHtml(url);
    } catch {
      // Se não for uma URL válida, sanitiza como string normal
      return this.stripHtml(url);
    }
  }

  /**
   * Sanitiza texto que pode conter markdown, preservando formatação básica
   */
  static sanitizeMarkdown(text: string): string {
    if (typeof text !== 'string') {
      return text;
    }

    // Remove scripts e tags perigosas mas preserva markdown básico
    return text
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .replace(/<object[^>]*>.*?<\/object>/gi, '')
      .replace(/<embed[^>]*>.*?<\/embed>/gi, '');
  }

  /**
   * Sanitiza um objeto recursivamente
   */
  static sanitizeObject(obj: any, options: SanitizationOptions = {}): any {
    if (obj === null || obj === undefined) {
      return obj;
    }

    const {
      skipFields = ['password', 'token', 'secret', 'key'],
      emailFields = ['email'],
      urlFields = ['url', 'website', 'link'],
      markdownFields = ['description', 'content', 'bio'],
    } = options;

    if (typeof obj === 'string') {
      return this.sanitizeString(obj);
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObject(item, options));
    }

    if (typeof obj === 'object') {
      const sanitized: any = {};
      
      for (const [key, value] of Object.entries(obj)) {
        const lowerKey = key.toLowerCase();
        
        if (skipFields.some(field => lowerKey === field.toLowerCase() || lowerKey.includes(field.toLowerCase()))) {
          // Não sanitizar campos sensíveis
          sanitized[key] = value;
        } else if (emailFields.some(field => lowerKey === field.toLowerCase() || lowerKey.includes(field.toLowerCase()))) {
          // Sanitização específica para emails
          sanitized[key] = typeof value === 'string' ? this.sanitizeEmail(value) : value;
        } else if (urlFields.some(field => lowerKey === field.toLowerCase() || lowerKey.includes(field.toLowerCase()))) {
          // Sanitização específica para URLs
          sanitized[key] = typeof value === 'string' ? this.sanitizeUrl(value) : value;
        } else if (markdownFields.some(field => lowerKey === field.toLowerCase() || lowerKey.includes(field.toLowerCase()))) {
          // Sanitização específica para markdown
          sanitized[key] = typeof value === 'string' ? this.sanitizeMarkdown(value) : value;
        } else {
          // Sanitização recursiva padrão
          sanitized[key] = this.sanitizeObject(value, options);
        }
      }
      
      return sanitized;
    }

    return obj;
  }

  /**
   * Verifica se um valor contém conteúdo potencialmente perigoso
   */
  static containsDangerousContent(value: string): boolean {
    if (typeof value !== 'string') {
      return false;
    }

    const dangerousPatterns = [
      /<script[^>]*>/gi,
      /<\/script>/gi,
      /<iframe[^>]*>/gi,
      /javascript:/gi,
      /vbscript:/gi,
      /data:text\/html/gi,
      /on\w+\s*=/gi,
      /<object[^>]*>/gi,
      /<embed[^>]*>/gi,
      /\beval\s*\(/gi,
      /\bFunction\s*\(/gi,
      /alert\s*\(/gi,
      /document\./gi,
      /window\./gi,
    ];

    return dangerousPatterns.some(pattern => pattern.test(value));
  }

  /**
   * Remove tags HTML de uma string
   */
  static stripHtml(input: string): string {
    if (!input || typeof input !== 'string') {
      return input;
    }

    return input
      // Remove completamente scripts e seus conteúdos
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      // Remove completamente styles e seus conteúdos
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      // Remove apenas as tags HTML, preservando o conteúdo
      .replace(/<\/?[^>]+(>|$)/g, '')
      // Remove javascript: URLs
      .replace(/javascript:/gi, '')
      // Remove eventos on*
      .replace(/\son\w+\s*=\s*["'][^"']*["']/gi, '')
      // Remove múltiplos espaços
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Escapa caracteres especiais para uso em HTML
   */
  static escapeHtml(input: string): string {
    if (typeof input !== 'string') {
      return input;
    }

    const htmlEscapes: { [key: string]: string } = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '/': '&#x2F;',
    };

    return input.replace(/[&<>"'\/]/g, (match) => htmlEscapes[match]);
  }
}

/**
 * Opções para configurar a sanitização de objetos
 */
export interface SanitizationOptions {
  /** Campos que devem ser ignorados na sanitização */
  skipFields?: string[];
  /** Campos que contêm emails */
  emailFields?: string[];
  /** Campos que contêm URLs */
  urlFields?: string[];
  /** Campos que contêm markdown */
  markdownFields?: string[];
}