import { AuditEventPayload } from '../../../audit-logs/domain/events/audit-event.payload';

export const CHECKOUT_CREATED_AUDIT_EVENT = 'checkout.created.audit';

export type CheckoutCreatedAuditPayload = AuditEventPayload;
