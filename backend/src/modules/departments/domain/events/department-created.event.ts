import type { AuditEventPayload } from '../../../audit-logs/domain/events/audit-event.payload';

export const DEPARTMENT_CREATED_EVENT = 'department.created';

export type DepartmentCreatedPayload = AuditEventPayload;
