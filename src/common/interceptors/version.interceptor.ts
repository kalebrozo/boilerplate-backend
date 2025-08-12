import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import { API_VERSION_KEY } from '../decorators/api-version.decorator';

@Injectable()
export class VersionInterceptor implements NestInterceptor {
  constructor(private reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const version = this.reflector.get<string>(
      API_VERSION_KEY,
      context.getClass(),
    ) || request.version || '1';

    return next.handle().pipe(
      map((data) => {
        // Se a resposta já tem metadados de versão, não sobrescrever
        if (data && typeof data === 'object' && data.metadata?.version) {
          return data;
        }

        // Adicionar informações de versão para respostas simples
        if (data && typeof data === 'object' && !Array.isArray(data)) {
          return {
            ...data,
            _version: {
              api: version,
              timestamp: new Date().toISOString(),
              endpoint: `${request.method} ${request.url}`,
            },
          };
        }

        // Para arrays ou dados primitivos, envolver em um objeto
        return {
          data,
          _version: {
            api: version,
            timestamp: new Date().toISOString(),
            endpoint: `${request.method} ${request.url}`,
          },
        };
      }),
    );
  }
}