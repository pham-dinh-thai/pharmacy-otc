import type { AuditEventPayload } from '../../../audit-logs/domain/events/audit-event.payload';

export const EXPENSE_PAID_EVENT = 'expense.paid';

export type ExpensePaidPayload = AuditEventPayload;
