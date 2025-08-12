import { Module } from '@nestjs/common';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from './logger.service';

@Module({
  imports: [
    WinstonModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const nodeEnv = configService.get('NODE_ENV', 'development');
        const isProduction = nodeEnv === 'production';
        
        return {
          level: isProduction ? 'info' : 'debug',
          format: winston.format.combine(
            winston.format.timestamp({
              format: 'YYYY-MM-DD HH:mm:ss',
            }),
            winston.format.errors({ stack: true }),
            winston.format.json(),
          ),
          defaultMeta: {
            service: 'saas-boilerplate',
            environment: nodeEnv,
          },
          transports: [
            // Console transport
            new winston.transports.Console({
              format: winston.format.combine(
                winston.format.colorize(),
                winston.format.printf(({ timestamp, level, message, context, stack, ...meta }) => {
                  const contextStr = context ? `[${context}]` : '';
                  const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
                  const stackStr = stack ? `\n${stack}` : '';
                  return `${timestamp} ${contextStr} ${level}: ${message}${metaStr}${stackStr}`;
                }),
              ),
            }),
            
            // Error log file
            new winston.transports.File({
              filename: 'logs/error.log',
              level: 'error',
              format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json(),
              ),
              maxsize: 5242880, // 5MB
              maxFiles: 5,
            }),
            
            // Combined log file
            new winston.transports.File({
              filename: 'logs/combined.log',
              format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json(),
              ),
              maxsize: 5242880, // 5MB
              maxFiles: 5,
            }),
            
            // Warning log file
            new winston.transports.File({
              filename: 'logs/warn.log',
              level: 'warn',
              format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json(),
              ),
              maxsize: 5242880, // 5MB
              maxFiles: 3,
            }),
          ],
          
          // Configurações adicionais para produção
          ...(isProduction && {
            exceptionHandlers: [
              new winston.transports.File({
                filename: 'logs/exceptions.log',
                format: winston.format.combine(
                  winston.format.timestamp(),
                  winston.format.json(),
                ),
              }),
            ],
            rejectionHandlers: [
              new winston.transports.File({
                filename: 'logs/rejections.log',
                format: winston.format.combine(
                  winston.format.timestamp(),
                  winston.format.json(),
                ),
              }),
            ],
          }),
        };
      },
    }),
  ],
  providers: [LoggerService],
  exports: [WinstonModule, LoggerService],
})
export class LoggerModule {}