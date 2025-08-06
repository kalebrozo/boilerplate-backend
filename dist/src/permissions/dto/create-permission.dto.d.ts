export declare enum Action {
    MANAGE = "manage",
    CREATE = "create",
    READ = "read",
    UPDATE = "update",
    DELETE = "delete"
}
export declare class CreatePermissionDto {
    action: Action;
    subject: string;
}
export declare class UpdatePermissionDto {
    action?: Action;
    subject?: string;
}
