import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { LoggerService } from '../logger/logger.service';
import { Request, Response } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: LoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const startTime = Date.now();

    // Log da requisição de entrada
    this.logger.debug('Incoming request', {
      method: request.method,
      url: request.url,
      ip: request.ip,
      userAgent: request.get('User-Agent'),
      userId: (request as any).user?.id,
      requestId: (request as any).id,
      body: this.sanitizeBody(request.body),
      query: request.query,
      params: request.params,
    });

    return next.handle().pipe(
      tap({
        next: (data) => {
          const responseTime = Date.now() - startTime;
          
          // Log da resposta de sucesso
          this.logger.logRequest(request, response, responseTime);
          
          // Log adicional para respostas lentas
          if (responseTime > 1000) {
            this.logger.warn('Slow response detected', {
              method: request.method,
              url: request.url,
              responseTime,
              userId: (request as any).user?.id,
              requestId: (request as any).id,
            });
          }
        },
        error: (error) => {
          const responseTime = Date.now() - startTime;
          
          // Log do erro
          this.logger.error(
            `Request failed: ${error.message}`,
            error.stack,
            {
              method: request.method,
              url: request.url,
              statusCode: error.status || 500,
              responseTime,
              ip: request.ip,
              userAgent: request.get('User-Agent'),
              userId: (request as any).user?.id,
              requestId: (request as any).id,
              errorName: error.name,
              errorCode: error.code,
            },
          );
        },
      }),
    );
  }

  private sanitizeBody(body: any): any {
    if (!body) return body;

    const sensitiveFields = [
      'password',
      'token',
      'secret',
      'key',
      'authorization',
      'cookie',
      'session',
    ];

    const sanitized = { ...body };

    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    }

    return sanitized;
  }
}