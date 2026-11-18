import type { AuditEventPayload } from '../../../audit-logs/domain/events/audit-event.payload';

export const SUPPLIER_DELETED_EVENT = 'supplier.deleted';

export type SupplierDeletedPayload = AuditEventPayload;
