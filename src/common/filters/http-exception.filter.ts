import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  ValidationError,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();

    const exceptionResponse = exception.getResponse();
    let message =
      typeof exceptionResponse === 'string'
        ? exceptionResponse
        : (exceptionResponse as any).message || 'Internal server error';

    // Log validation errors to console
    if (status === HttpStatus.BAD_REQUEST) {
      console.error(`[VALIDATION ERROR] ${request.method} ${request.url}`);
      console.error('Status:', status);
      console.error('Message:', message);
      
      if ((exceptionResponse as any).errors) {
        console.error('Validation errors:', JSON.stringify((exceptionResponse as any).errors, null, 2));
      }
    }

    response.status(status).json({
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}