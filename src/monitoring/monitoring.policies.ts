import { Injectable } from '@nestjs/common';
import { PolicyHandler } from '../casl/interfaces/policy-handler.interface';
import { Action } from '../casl/action.enum';

@Injectable()
export class ReadMonitoringPolicyHandler implements PolicyHandler {
  handle(ability: any) {
    return ability.can(Action.Read, 'Monitoring');
  }
}

@Injectable()
export class ManageMonitoringPolicyHandler implements PolicyHandler {
  handle(ability: any) {
    return ability.can(Action.Manage, 'Monitoring');
  }
}