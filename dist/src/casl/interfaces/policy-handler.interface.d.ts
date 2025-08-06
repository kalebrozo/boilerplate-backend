import { AppAbility } from '../casl-ability.factory';
export interface PolicyHandler {
    handle(ability: AppAbility): boolean;
}
export type PolicyHandlerCallback = (ability: AppAbility) => boolean;
export declare class PolicyHandlerImpl implements PolicyHandler {
    private callback;
    constructor(callback: PolicyHandlerCallback);
    handle(ability: AppAbility): boolean;
}
