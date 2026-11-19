import type { AuditEventPayload } from '../../../audit-logs/domain/events/audit-event.payload';

export const CATEGORY_CREATED_EVENT = 'category.created';

export type CategoryCreatedPayload = AuditEventPayload;
