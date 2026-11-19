import type { AuditEventPayload } from '../../../audit-logs/domain/events/audit-event.payload';

export const PRODUCT_DELETED_EVENT = 'product.deleted';

export type ProductDeletedPayload = AuditEventPayload;
