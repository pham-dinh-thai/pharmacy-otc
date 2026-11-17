import type { AuditEventPayload } from '../../../audit-logs/domain/events/audit-event.payload';

export const EMPLOYEE_UPDATED_EVENT = 'employee.updated';

export type EmployeeUpdatedPayload = AuditEventPayload;
