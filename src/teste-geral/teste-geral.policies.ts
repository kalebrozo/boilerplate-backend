import { Injectable } from '@nestjs/common';
import { PolicyHandler } from '../casl/interfaces/policy-handler.interface';
import { Action } from '../casl/action.enum';

@Injectable()
export class ReadTesteGeralPolicyHandler implements PolicyHandler {
  handle(ability: any) {
    return ability.can(Action.Read, 'TesteGeral');
  }
}

@Injectable()
export class CreateTesteGeralPolicyHandler implements PolicyHandler {
  handle(ability: any) {
    return ability.can(Action.Create, 'TesteGeral');
  }
}

@Injectable()
export class UpdateTesteGeralPolicyHandler implements PolicyHandler {
  handle(ability: any) {
    return ability.can(Action.Update, 'TesteGeral');
  }
}

@Injectable()
export class DeleteTesteGeralPolicyHandler implements PolicyHandler {
  handle(ability: any) {
    return ability.can(Action.Delete, 'TesteGeral');
  }
}