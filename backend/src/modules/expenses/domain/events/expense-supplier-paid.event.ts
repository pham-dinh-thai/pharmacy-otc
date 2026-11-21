import type { AuditEventPayload } from '../../../audit-logs/domain/events/audit-event.payload';

export const EXPENSE_SUPPLIER_PAID_EVENT = 'expense.supplier_paid';

export type ExpenseSupplierPaidPayload = AuditEventPayload;
