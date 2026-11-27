import { describe, expect, it } from '@jest/globals';
import { PaymentInvalidNotificationException } from '../../domain/exceptions/payment.exception';
import { parseSepayIpn } from './sepay-ipn.mapper';

const validBody = () => ({
  notification_type: 'ORDER_PAID',
  order: {
    id: 'sepay-order-uuid',
    order_invoice_number: 'DH0123456789',
    order_status: 'CAPTURED',
    order_amount: '50000.00',
  },
  transaction: {
    id: 'sepay-transaction-uuid',
    transaction_id: '68ba94ac80123',
    transaction_status: 'APPROVED',
    transaction_amount: '50000',
    payment_method: 'CARD',
    card_number: '4111XXXXXXXX1111',
  },
});

describe('parseSepayIpn', () => {
  it('normalizes SePay payload and keeps the raw body', () => {
    const body = validBody();

    expect(parseSepayIpn(body)).toEqual({
      raw: body,
      notificationType: 'ORDER_PAID',
      order: {
        id: 'sepay-order-uuid',
        invoiceNumber: 'DH0123456789',
        amount: 50000n,
        status: 'CAPTURED',
      },
      transaction: {
        id: 'sepay-transaction-uuid',
        transactionId: '68ba94ac80123',
        status: 'APPROVED',
        amount: 50000n,
        paymentMethod: 'CARD',
        bankCode: null,
        responseCode: null,
      },
    });
  });

  it('rejects a payload without order or transaction', () => {
    expect(() => parseSepayIpn({ notification_type: 'ORDER_PAID' })).toThrow(
      PaymentInvalidNotificationException,
    );
  });

  it('rejects a non-integer amount', () => {
    const body = validBody();
    body.transaction.transaction_amount = '50000.50';

    expect(() => parseSepayIpn(body)).toThrow(
      PaymentInvalidNotificationException,
    );
  });
});
