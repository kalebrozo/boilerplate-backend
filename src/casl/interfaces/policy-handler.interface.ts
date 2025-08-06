import { AppAbility } from '../casl-ability.factory';

export interface PolicyHandler {
  handle(ability: AppAbility): boolean;
}

export type PolicyHandlerCallback = (ability: AppAbility) => boolean;

export class PolicyHandlerImpl implements PolicyHandler {
  constructor(private callback: PolicyHandlerCallback) {}

  handle(ability: AppAbility): boolean {
    return this.callback(ability);
  }
}