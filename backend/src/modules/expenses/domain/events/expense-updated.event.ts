import type { AuditEventPayload } from '../../../audit-logs/domain/events/audit-event.payload';

export const EXPENSE_UPDATED_EVENT = 'expense.updated';

export type ExpenseUpdatedPayload = AuditEventPayload;
