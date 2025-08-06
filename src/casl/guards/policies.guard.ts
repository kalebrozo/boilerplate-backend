import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CaslAbilityFactory } from '../casl-ability.factory';
import { CHECK_POLICIES_KEY } from '../decorators/check-policies.decorator';
import { PolicyHandler } from '../interfaces/policy-handler.interface';

@Injectable()
export class PoliciesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private caslAbilityFactory: CaslAbilityFactory,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const policyHandlers =
      this.reflector.get<PolicyHandler[]>(
        CHECK_POLICIES_KEY,
        context.getHandler(),
      ) || [];

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return false;
    }

    const ability = this.caslAbilityFactory.createForUser(user);

    return policyHandlers.every((handler) =>
      handler.handle(ability),
    );
  }
}