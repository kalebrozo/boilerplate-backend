import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { API_VERSION_KEY } from '../decorators/api-version.decorator';

@Injectable()
export class VersionGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const requestedVersion = request.version || '1';
    
    // Obter versão requerida pelo controller/handler
    const requiredVersion = this.reflector.getAllAndOverride<string>(
      API_VERSION_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Se não há versão específica requerida, permitir acesso
    if (!requiredVersion) {
      return true;
    }

    // Verificar se a versão solicitada corresponde à requerida
    if (requestedVersion !== requiredVersion) {
      throw new ForbiddenException(
        `This endpoint requires API version ${requiredVersion}, but version ${requestedVersion} was requested`,
      );
    }

    return true;
  }
}