import type { AuditEventPayload } from '../../../audit-logs/domain/events/audit-event.payload';

export const DEPARTMENT_RESTORED_EVENT = 'department.restored';

export type DepartmentRestoredPayload = AuditEventPayload;
