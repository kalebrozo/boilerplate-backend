import { Ability } from '@casl/ability';
export declare enum Action {
    Manage = "manage",
    Create = "create",
    Read = "read",
    Update = "update",
    Delete = "delete"
}
export type Subjects = string;
export type AppAbility = Ability<[Action, Subjects]>;
export declare class CaslAbilityFactory {
    createForUser(user: any): Ability<[Action, string], import("@casl/ability").MongoQuery>;
}
