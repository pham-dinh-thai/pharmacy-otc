import { describe, expect, it, jest } from '@jest/globals';
import { Order } from '../../../../orders/domain/order.aggregate';
import { OrderLine } from '../../../../orders/domain/order-line.entity';
import type { IOrdersRepository } from '../../../../orders/domain/orders.repository';
import { PaymentProvider } from '../../../domain/enums/payment-provider.enum';
import { Payment } from '../../../domain/payment.aggregate';
import type { IPaymentsRepository } from '../../../domain/payments.repository';
import { GetPaymentGatewayQuery } from './get-payment-gateway.query';
import { GetPaymentGatewayHandler } from './get-payment-gateway.handler';

const USER_ID = '9f7a1c3e-2b4d-4a61-8f0e-1c2d3e4f5a6b';
const CHECKOUT_ID = '01931f7a-1c3e-7a61-8f0e-1c2d3e4f5a6b';
const PRODUCT_ID = '642b3190-9e97-4ce3-8533-894bc879b4fc';

const setup = () => {
  const order = Order.create({
    checkoutId: CHECKOUT_ID,
    userId: USER_ID,
    lines: [
      OrderLine.create({
        productId: PRODUCT_ID,
        productName: 'Paracetamol',
        productSku: 'SKU-001',
        unitPrice: 25000n,
        quantity: 1,
      }),
    ],
    shippingName: 'Nguyen Van A',
    shippingAddress: '1 Nguyen Hue',
    shippingPhone: '0901234567',
    shippingFee: 0n,
    note: null,
  });
  const gateway = {
    url: 'https://pay.example',
    fields: [{ name: 'merchant', value: 'id' }],
  };
  const payment = Payment.create({
    orderId: order.getId(),
    provider: PaymentProvider.SEPAY,
    amount: 25000n,
    transactionRef: 'DH0123456789',
    gateway,
  });
  const findOrder = jest
    .fn<IOrdersRepository['findById']>()
    .mockResolvedValue(order);
  const findPayment = jest
    .fn<IPaymentsRepository['findByOrderId']>()
    .mockResolvedValue(payment);

  const handler = new GetPaymentGatewayHandler(
    { findById: findOrder } as unknown as IOrdersRepository,
    { findByOrderId: findPayment } as unknown as IPaymentsRepository,
  );

  return { handler, order, gateway, findOrder, findPayment };
};

describe('GetPaymentGatewayHandler', () => {
  it('returns persisted gateway fields to the order owner', async () => {
    const { handler, order, gateway } = setup();

    const result = await handler.execute(
      new GetPaymentGatewayQuery(order.getId(), USER_ID),
    );

    expect(result).toMatchObject({
      orderId: order.getId(),
      provider: PaymentProvider.SEPAY,
      amount: '25000',
      transactionRef: 'DH0123456789',
      gateway,
    });
  });

  it('hides the gateway from another user', async () => {
    const { handler, order } = setup();

    await expect(
      handler.execute(new GetPaymentGatewayQuery(order.getId(), 'other-user')),
    ).rejects.toThrow();
  });
});
