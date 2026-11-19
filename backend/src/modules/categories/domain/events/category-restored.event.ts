import type { AuditEventPayload } from '../../../audit-logs/domain/events/audit-event.payload';

export const CATEGORY_RESTORED_EVENT = 'category.restored';

export type CategoryRestoredPayload = AuditEventPayload;
