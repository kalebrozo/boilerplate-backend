import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

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

  // Habilitar CORS
  app.enableCors();

  // Graceful shutdown
  app.enableShutdownHooks();

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3000);

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