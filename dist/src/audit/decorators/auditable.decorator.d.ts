export declare const AUDITABLE_KEY = "auditable";
export interface AuditableMetadata {
    action: string;
    subject: string;
}
export declare const Auditable: (action: string, subject: string) => import("@nestjs/common").CustomDecorator<string>;
