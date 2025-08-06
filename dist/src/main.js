"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const swagger_1 = require("@nestjs/swagger");
const app_module_1 = require("./app.module");
const http_exception_filter_1 = require("./common/filters/http-exception.filter");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
            enableImplicitConversion: true,
        },
    }));
    app.useGlobalFilters(new http_exception_filter_1.HttpExceptionFilter());
    app.enableCors();
    app.enableShutdownHooks();
    const configService = app.get(config_1.ConfigService);
    const port = configService.get('PORT', 3000);
    const config = new swagger_1.DocumentBuilder()
        .setTitle(configService.get('SWAGGER_TITLE', 'SaaS Boilerplate API'))
        .setDescription(configService.get('SWAGGER_DESCRIPTION', 'Multi-tenant SaaS backend API'))
        .setVersion(configService.get('SWAGGER_VERSION', '1.0.0'))
        .addBearerAuth()
        .addServer(`http://localhost:${port}`)
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup('api-docs', app, document, {
        swaggerOptions: {
            persistAuthorization: true,
        },
    });
    await app.listen(port);
    console.log(`Application is running on: http://localhost:${port}`);
    console.log(`Swagger documentation: http://localhost:${port}/api-docs`);
}
bootstrap();
//# sourceMappingURL=main.js.map