import type { AuditEventPayload } from '../../../audit-logs/domain/events/audit-event.payload';

export const ROLE_RESTORED_EVENT = 'role.restored';

export type RoleRestoredPayload = AuditEventPayload;
