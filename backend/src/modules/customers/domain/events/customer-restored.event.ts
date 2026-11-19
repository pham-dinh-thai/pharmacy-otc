import type { AuditEventPayload } from '../../../audit-logs/domain/events/audit-event.payload';

export const CUSTOMER_RESTORED_EVENT = 'customer.restored';

export type CustomerRestoredPayload = AuditEventPayload;
