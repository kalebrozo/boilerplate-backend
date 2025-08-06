import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { RolesModule } from './roles/roles.module';
import { PermissionsModule } from './permissions/permissions.module';
import { TenantsModule } from './tenants/tenants.module';
import { PrismaModule } from './prisma/prisma.module';
import { AuditModule } from './audit/audit.module';
import { CaslModule } from './casl/casl.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { PoliciesGuard } from './casl/guards/policies.guard';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { AuditInterceptor } from './audit/interceptors/audit.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    RolesModule,
    PermissionsModule,
    TenantsModule,
    AuditModule,
    CaslModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: PoliciesGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
  ],
})
export class AppModule {}