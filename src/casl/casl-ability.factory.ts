import { Injectable } from '@nestjs/common';
import { AbilityBuilder, Ability, AbilityClass } from '@casl/ability';

export enum Action {
  Manage = 'manage',
  Create = 'create',
  Read = 'read',
  Update = 'update',
  Delete = 'delete',
}

export type Subjects = string;
export type AppAbility = Ability<[Action, Subjects]>;

@Injectable()
export class CaslAbilityFactory {
  createForUser(user: any) {
    const { can, cannot, build } = new AbilityBuilder<Ability<[Action, Subjects]>>(
      Ability as AbilityClass<AppAbility>
    );

    // Admin pode tudo
    if (user.role.name === 'admin') {
      can(Action.Manage, 'all');
    }

    // User pode ler e atualizar seu próprio perfil
    can(Action.Read, 'User', { id: user.id });
    can(Action.Update, 'User', { id: user.id });

    // User pode ler roles
    can(Action.Read, 'Role');

    // User pode ler tenants
    can(Action.Read, 'Tenant');

    // Permissões baseadas nas permissões do role
    if (user.role.permissions) {
      user.role.permissions.forEach((permission: any) => {
        can(permission.action as Action, permission.subject);
      });
    }

    return build({
      detectSubjectType: (item) => String(item),
    });
  }
}