import type { AuditEventPayload } from '../../../audit-logs/domain/events/audit-event.payload';

export const CUSTOMER_CREATED_EVENT = 'customer.created';

export type CustomerCreatedPayload = AuditEventPayload;
