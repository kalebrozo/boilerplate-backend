import { Injectable, Inject, LoggerService as NestLoggerService } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

export interface LogContext {
  userId?: string;
  requestId?: string;
  ip?: string;
  userAgent?: string;
  method?: string;
  url?: string;
  statusCode?: number;
  responseTime?: number;
  [key: string]: any;
}

@Injectable()
export class LoggerService implements NestLoggerService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  log(message: string, context?: string | LogContext) {
    this.info(message, context);
  }

  info(message: string, context?: string | LogContext) {
    const logContext = this.formatContext(context);
    this.logger.info(message, logContext);
  }

  error(message: string, trace?: string, context?: string | LogContext) {
    const logContext = this.formatContext(context);
    this.logger.error(message, {
      ...logContext,
      stack: trace,
    });
  }

  warn(message: string, context?: string | LogContext) {
    const logContext = this.formatContext(context);
    this.logger.warn(message, logContext);
  }

  debug(message: string, context?: string | LogContext) {
    const logContext = this.formatContext(context);
    this.logger.debug(message, logContext);
  }

  verbose(message: string, context?: string | LogContext) {
    const logContext = this.formatContext(context);
    this.logger.verbose(message, logContext);
  }

  // Métodos específicos para diferentes tipos de logs
  logRequest(req: any, res: any, responseTime: number) {
    const context: LogContext = {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      responseTime,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user?.id,
      requestId: req.id,
    };

    const message = `${req.method} ${req.url} ${res.statusCode} - ${responseTime}ms`;
    
    if (res.statusCode >= 400) {
      this.warn(message, context);
    } else {
      this.info(message, context);
    }
  }

  logDatabaseQuery(query: string, duration: number, context?: LogContext) {
    this.debug('Database query executed', {
      ...context,
      query,
      duration,
      type: 'database',
    });
  }

  logAuthentication(userId: string, action: string, success: boolean, context?: LogContext) {
    const message = `Authentication ${action} ${success ? 'successful' : 'failed'} for user ${userId}`;
    const logContext: LogContext = {
      ...context,
      userId,
      action,
      success,
      type: 'authentication',
    };

    if (success) {
      this.info(message, logContext);
    } else {
      this.warn(message, logContext);
    }
  }

  logBusinessEvent(event: string, data: any, context?: LogContext) {
    this.info(`Business event: ${event}`, {
      ...context,
      event,
      data,
      type: 'business',
    });
  }

  logSecurityEvent(event: string, severity: 'low' | 'medium' | 'high', context?: LogContext) {
    const message = `Security event: ${event}`;
    const logContext: LogContext = {
      ...context,
      event,
      severity,
      type: 'security',
    };

    switch (severity) {
      case 'high':
        this.error(message, undefined, logContext);
        break;
      case 'medium':
        this.warn(message, logContext);
        break;
      default:
        this.info(message, logContext);
    }
  }

  private formatContext(context?: string | LogContext): LogContext {
    if (typeof context === 'string') {
      return { context };
    }
    return context || {};
  }
}