import type { AuditEventPayload } from '../../../audit-logs/domain/events/audit-event.payload';

export const EMPLOYEE_STATUS_CHANGED_EVENT = 'employee.status_changed.audit';

export type EmployeeStatusChangedPayload = AuditEventPayload;
