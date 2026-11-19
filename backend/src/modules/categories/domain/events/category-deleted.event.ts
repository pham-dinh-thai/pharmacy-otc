import type { AuditEventPayload } from '../../../audit-logs/domain/events/audit-event.payload';

export const CATEGORY_DELETED_EVENT = 'category.deleted';

export type CategoryDeletedPayload = AuditEventPayload;
