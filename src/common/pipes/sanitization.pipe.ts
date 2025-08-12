import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';
import { LoggerService } from '../logger/logger.service';
import { SanitizationUtil } from '../utils/sanitization.util';

@Injectable()
export class SanitizationPipe implements PipeTransform {
  constructor(private readonly logger: LoggerService) {}

  transform(value: any, metadata: ArgumentMetadata) {
    if (!value || metadata.type !== 'body') {
      return value;
    }

    const sanitized = this.sanitizeValue(value);
    
    // Log se houve sanitização
    if (JSON.stringify(value) !== JSON.stringify(sanitized)) {
      this.logger.warn('Potentially dangerous content sanitized', {
        type: metadata.type,
        metatype: metadata.metatype?.name,
        originalLength: JSON.stringify(value).length,
        sanitizedLength: JSON.stringify(sanitized).length,
      });
    }

    return sanitized;
  }

  private sanitizeValue(value: any): any {
    if (value === null || value === undefined) {
      return value;
    }

    if (typeof value === 'string') {
      const sanitized = SanitizationUtil.sanitizeString(value);
      
      // Verificar se contém conteúdo suspeito após sanitização
      if (this.containsSuspiciousContent(sanitized)) {
        throw new BadRequestException(
          'Input contains potentially dangerous content that could not be safely sanitized'
        );
      }
      
      return sanitized;
    }

    if (Array.isArray(value)) {
      return value.map(item => this.sanitizeValue(item));
    }

    if (typeof value === 'object') {
      // Preservar objetos Date
      if (value instanceof Date) {
        return value;
      }
      
      const sanitized: any = {};
      
      for (const [key, val] of Object.entries(value)) {
        sanitized[key] = this.sanitizeValue(val);
      }
      
      return sanitized;
    }

    return value;
  }

  private containsSuspiciousContent(value: string): boolean {
    // Padrões que ainda são perigosos mesmo após sanitização
    const suspiciousPatterns = [
      /data:text\/html/gi,
      /vbscript:/gi,
      /livescript:/gi,
      /\beval\s*\(/gi,
      /\bFunction\s*\(/gi,
      /\bsetTimeout\s*\(/gi,
      /\bsetInterval\s*\(/gi,
    ];

    return suspiciousPatterns.some(pattern => pattern.test(value));
  }
}