import type { AuditEventPayload } from '../../../audit-logs/domain/events/audit-event.payload';

export const SUPPLIER_RESTORED_EVENT = 'supplier.restored';

export type SupplierRestoredPayload = AuditEventPayload;
