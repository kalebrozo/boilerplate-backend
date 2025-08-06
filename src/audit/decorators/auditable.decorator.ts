import { SetMetadata } from '@nestjs/common';

export const AUDITABLE_KEY = 'auditable';

export interface AuditableMetadata {
  action: string;
  subject: string;
}

export const Auditable = (action: string, subject: string) =>
  SetMetadata(AUDITABLE_KEY, { action, subject });