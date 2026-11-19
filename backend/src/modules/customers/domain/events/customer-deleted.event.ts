import type { AuditEventPayload } from '../../../audit-logs/domain/events/audit-event.payload';

export const CUSTOMER_DELETED_EVENT = 'customer.deleted';

export type CustomerDeletedPayload = AuditEventPayload;
