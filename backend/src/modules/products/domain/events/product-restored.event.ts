import type { AuditEventPayload } from '../../../audit-logs/domain/events/audit-event.payload';

export const PRODUCT_RESTORED_EVENT = 'product.restored';

export type ProductRestoredPayload = AuditEventPayload;
