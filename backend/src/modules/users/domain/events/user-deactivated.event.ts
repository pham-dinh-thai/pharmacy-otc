import type { AuditEventPayload } from '../../../audit-logs/domain/events/audit-event.payload';

export const USER_DEACTIVATED_EVENT = 'user.deactivated.audit';

export type UserDeactivatedPayload = AuditEventPayload;
