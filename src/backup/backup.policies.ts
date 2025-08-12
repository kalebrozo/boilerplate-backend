import { Injectable } from '@nestjs/common';
import { PolicyHandler } from '../casl/interfaces/policy-handler.interface';
import { Action } from '../casl/action.enum';

@Injectable()
export class CreateBackupPolicyHandler implements PolicyHandler {
  handle(ability: any) {
    return ability.can(Action.Create, 'System');
  }
}

@Injectable()
export class ReadBackupPolicyHandler implements PolicyHandler {
  handle(ability: any) {
    return ability.can(Action.Read, 'System');
  }
}