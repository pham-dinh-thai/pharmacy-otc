import type { AuditEventPayload } from '../../../audit-logs/domain/events/audit-event.payload';

export const CUSTOMER_UPDATED_EVENT = 'customer.updated';

export type CustomerUpdatedPayload = AuditEventPayload;
