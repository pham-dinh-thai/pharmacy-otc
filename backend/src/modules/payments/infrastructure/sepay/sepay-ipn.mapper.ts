import type { SepayIpnPayload } from '../../application/commands/handle-sepay-ipn/handle-sepay-ipn.command';
import { PaymentInvalidNotificationException } from '../../domain/exceptions/payment.exception';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const readString = (value: unknown, field: string): string => {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new PaymentInvalidNotificationException(
      `Missing or invalid ${field}`,
    );
  }

  return value;
};

const readStringOrNull = (value: unknown): string | null =>
  typeof value === 'string' && value.trim() ? value : null;

function parseIpnAmount(value: unknown): bigint {
  if (typeof value !== 'string' && typeof value !== 'number') {
    throw new PaymentInvalidNotificationException('Invalid IPN amount');
  }

  const text = String(value).trim();

  if (!/^\d+(\.0+)?$/.test(text)) {
    throw new PaymentInvalidNotificationException(
      `Invalid IPN amount: ${text}`,
    );
  }

  return BigInt(text.split('.')[0]);
}

export function parseSepayIpn(body: unknown): SepayIpnPayload {
  if (!isRecord(body)) {
    throw new PaymentInvalidNotificationException();
  }

  const order = body.order;
  const transaction = body.transaction;

  if (!isRecord(order) || !isRecord(transaction)) {
    throw new PaymentInvalidNotificationException();
  }

  return {
    raw: body,
    notificationType: readString(body.notification_type, 'notification_type'),
    order: {
      id: readString(order.id, 'order.id'),
      invoiceNumber: readString(
        order.order_invoice_number,
        'order.order_invoice_number',
      ),
      amount: parseIpnAmount(order.order_amount),
      status: readString(order.order_status, 'order.order_status'),
    },
    transaction: {
      id: readString(transaction.id, 'transaction.id'),
      transactionId: readStringOrNull(transaction.transaction_id),
      status: readString(
        transaction.transaction_status,
        'transaction.transaction_status',
      ),
      amount: parseIpnAmount(transaction.transaction_amount),
      paymentMethod: readStringOrNull(transaction.payment_method),
      bankCode: readStringOrNull(transaction.bank_code),
      responseCode: readStringOrNull(transaction.response_code),
    },
  };
}
