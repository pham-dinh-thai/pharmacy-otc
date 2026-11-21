import type { AuditEventPayload } from '../../../audit-logs/domain/events/audit-event.payload';

export const EXPENSE_CANCELLED_EVENT = 'expense.cancelled';

export type ExpenseCancelledPayload = AuditEventPayload;
