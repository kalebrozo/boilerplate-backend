import { Injectable } from '@nestjs/common';
import { PolicyHandler } from '../casl/interfaces/policy-handler.interface';
import { Action } from '../casl/action.enum';

@Injectable()
export class ReadMetricsPolicyHandler implements PolicyHandler {
  handle(ability: any) {
    return ability.can(Action.Read, 'Metrics');
  }
}

@Injectable()
export class ManageMetricsPolicyHandler implements PolicyHandler {
  handle(ability: any) {
    return ability.can(Action.Manage, 'Metrics');
  }
}