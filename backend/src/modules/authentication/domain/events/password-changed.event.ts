import type { AuditEventPayload } from '../../../audit-logs/domain/events/audit-event.payload';

export const PASSWORD_CHANGED_AUDIT_EVENT = 'account.password-change.audit';

export type PasswordChangedAuditPayload = AuditEventPayload;
