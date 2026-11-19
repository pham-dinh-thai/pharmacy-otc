import type { AuditEventPayload } from '../../../audit-logs/domain/events/audit-event.payload';

export const CATEGORY_UPDATED_EVENT = 'category.updated';

export type CategoryUpdatedPayload = AuditEventPayload;
