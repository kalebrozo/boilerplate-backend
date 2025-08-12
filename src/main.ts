import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import helmet from 'helmet';
import * as compression from 'compression';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);

  // Middleware de segurança - Helmet
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
    crossOriginEmbedderPolicy: false,
  }));

  // Compressão de resposta
  app.use(compression());

  // Configuração de versionamento de API
  app.enableVersioning({
    type: VersioningType.URI,
    prefix: 'v',
    defaultVersion: '1',
  });

  // Configuração global
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Filtro de exceção global
  app.useGlobalFilters(new HttpExceptionFilter());

  // CORS mais restritivo
  app.enableCors({
    origin: configService.get('ALLOWED_ORIGINS')?.split(',') || ['http://localhost:3003'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-tenant-id'],
    credentials: true,
  });

  // Graceful shutdown
  app.enableShutdownHooks();

  const port = 3003; // Porta fixa para garantir que sempre rode na 3003

  // Configuração do Swagger
  const config = new DocumentBuilder()
    .setTitle(configService.get('SWAGGER_TITLE', 'SaaS Boilerplate API'))
    .setDescription(configService.get('SWAGGER_DESCRIPTION', 'Multi-tenant SaaS backend API'))
    .setVersion(configService.get('SWAGGER_VERSION', '1.0.0'))
    .addBearerAuth()
    .addServer(`http://localhost:${port}`)
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
  console.log(`Swagger documentation: http://localhost:${port}/api-docs`);
}

bootstrap();