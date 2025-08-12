import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { LoggerService } from '../logger/logger.service';
import { SanitizationUtil } from '../utils/sanitization.util';

@Injectable()
export class SanitizationInterceptor implements NestInterceptor {
  constructor(private readonly logger: LoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    
    // Sanitizar body da requisição
    if (request.body) {
      request.body = this.sanitizeObject(request.body);
    }
    
    // Sanitizar query parameters
    if (request.query) {
      request.query = this.sanitizeObject(request.query);
    }
    
    // Sanitizar route parameters
    if (request.params) {
      request.params = this.sanitizeObject(request.params);
    }

    // Log da sanitização se houver mudanças
    this.logger.debug('Request data sanitized', {
      method: request.method,
      url: request.url,
      userId: request.user?.id,
      requestId: request.id,
    });

    return next.handle();
  }

  /**
   * Sanitiza recursivamente um objeto
   */
  private sanitizeObject(obj: any): any {
    if (obj === null || obj === undefined) {
      return obj;
    }

    if (typeof obj === 'string') {
      return SanitizationUtil.sanitizeString(obj);
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObject(item));
    }

    if (typeof obj === 'object') {
      const sanitized: any = {};
      
      for (const [key, value] of Object.entries(obj)) {
        // Não sanitizar campos sensíveis que já são tratados pelo LoggingInterceptor
        const sensitiveFields = [
          'password',
          'token',
          'secret',
          'key',
          'authorization',
          'cookie',
          'session',
        ];
        
        if (sensitiveFields.includes(key.toLowerCase())) {
          sanitized[key] = value; // Manter original para validação posterior
        } else {
          sanitized[key] = this.sanitizeObject(value);
        }
      }
      
      return sanitized;
    }

    return obj;
  }

  /**
   * Verifica se um valor contém conteúdo potencialmente perigoso
   */
  private containsDangerousContent(value: string): boolean {
    const dangerousPatterns = [
      /<script[^>]*>.*?<\/script>/gi,
      /<iframe[^>]*>.*?<\/iframe>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<object[^>]*>.*?<\/object>/gi,
      /<embed[^>]*>.*?<\/embed>/gi,
    ];

    return dangerousPatterns.some(pattern => pattern.test(value));
  }
}