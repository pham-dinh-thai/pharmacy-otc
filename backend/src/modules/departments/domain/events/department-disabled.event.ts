import type { AuditEventPayload } from '../../../audit-logs/domain/events/audit-event.payload';

export const DEPARTMENT_DISABLED_EVENT = 'department.disabled';

export type DepartmentDisabledPayload = AuditEventPayload;
