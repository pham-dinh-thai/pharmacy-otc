import type { AuditEventPayload } from '../../../audit-logs/domain/events/audit-event.payload';

export const PRODUCT_UPDATED_EVENT = 'product.updated';

export type ProductUpdatedPayload = AuditEventPayload;
