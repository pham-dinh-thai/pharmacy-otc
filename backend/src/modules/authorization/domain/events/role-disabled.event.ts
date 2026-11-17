import type { AuditEventPayload } from '../../../audit-logs/domain/events/audit-event.payload';

export const ROLE_DISABLED_EVENT = 'role.disabled';

export type RoleDisabledPayload = AuditEventPayload;
