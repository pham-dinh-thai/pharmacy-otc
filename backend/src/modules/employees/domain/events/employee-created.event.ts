import type { AuditEventPayload } from '../../../audit-logs/domain/events/audit-event.payload';

export const EMPLOYEE_CREATED_EVENT = 'employee.created';

export type EmployeeCreatedPayload = AuditEventPayload;
