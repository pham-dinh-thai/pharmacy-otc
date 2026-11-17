import type { AuditEventPayload } from '../../../audit-logs/domain/events/audit-event.payload';

export const DEPARTMENT_UPDATED_EVENT = 'department.updated';

export type DepartmentUpdatedPayload = AuditEventPayload;
