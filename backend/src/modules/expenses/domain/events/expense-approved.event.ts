import type { AuditEventPayload } from '../../../audit-logs/domain/events/audit-event.payload';

export const EXPENSE_APPROVED_EVENT = 'expense.approved';

export type ExpenseApprovedPayload = AuditEventPayload;
