import { describe, expect, it, jest } from '@jest/globals';
import { CommandBus } from '@nestjs/cqrs';
import { type IUnitOfWork } from '../../../../../shared/modules/unit-of-work/unit-of-work';
import { RecordAuditLogCommand } from '../../../../audit-logs/application/commands/record-audit-log/record-audit-log.command';
import { Order } from '../../../../orders/domain/order.aggregate';
import { OrderLine } from '../../../../orders/domain/order-line.entity';
import { OrderPaymentStatus } from '../../../../orders/domain/enums/order-payment-status.enum';
import { OrderNotFoundException } from '../../../../orders/domain/exceptions/order.exception';
import type { IOrdersRepository } from '../../../../orders/domain/orders.repository';
import { PaymentProvider } from '../../../domain/enums/payment-provider.enum';
import { PaymentStatus } from '../../../domain/enums/payment-status.enum';
import {
  PaymentAmountMismatchException,
  PaymentNotFoundException,
} from '../../../domain/exceptions/payment.exception';
import { Payment } from '../../../domain/payment.aggregate';
import type { IPaymentsRepository } from '../../../domain/payments.repository';
import {
  HandleSepayIpnCommand,
  type SepayIpnPayload,
} from './handle-sepay-ipn.command';
import { HandleSepayIpnHandler } from './handle-sepay-ipn.handler';

const USER_ID = '9f7a1c3e-2b4d-4a61-8f0e-1c2d3e4f5a6b';
const CHECKOUT_ID = '01931f7a-1c3e-7a61-8f0e-1c2d3e4f5a6b';
const PRODUCT_ID = '642b3190-9e97-4ce3-8533-894bc879b4fc';
const TRANSACTION_REF = 'DH0123456789';

const createPayload = (): SepayIpnPayload => ({
  raw: { notification_type: 'ORDER_PAID' },
  notificationType: 'ORDER_PAID',
  order: {
    id: 'sepay-order-uuid',
    invoiceNumber: TRANSACTION_REF,
    amount: 25000n,
    status: 'CAPTURED',
  },
  transaction: {
    id: 'sepay-transaction-uuid',
    transactionId: '68ba94ac80123',
    status: 'APPROVED',
    amount: 25000n,
    paymentMethod: 'BANK_TRANSFER',
    bankCode: null,
    responseCode: null,
  },
});

type SetupOptions = {
  payload?: SepayIpnPayload;
  paymentFound?: boolean;
  orderFound?: boolean;
  orderAlreadyPaid?: boolean;
};

const setup = ({
  payload = createPayload(),
  paymentFound = true,
  orderFound = true,
  orderAlreadyPaid = false,
}: SetupOptions = {}) => {
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

  if (orderAlreadyPaid) order.markPaid();

  const payment = Payment.create({
    orderId: order.getId(),
    provider: PaymentProvider.SEPAY,
    amount: 25000n,
    transactionRef: TRANSACTION_REF,
    gateway: {
      url: 'https://pay.example',
      fields: [{ name: 'merchant', value: 'SP-TEST' }],
    },
  });

  const findPayment = jest
    .fn<IPaymentsRepository['findByTransactionRef']>()
    .mockResolvedValue(paymentFound ? payment : null);
  const updatePayment = jest
    .fn<IPaymentsRepository['update']>()
    .mockImplementation((value) => Promise.resolve(value));
  const findOrder = jest
    .fn<IOrdersRepository['findById']>()
    .mockResolvedValue(orderFound ? order : null);
  const updateOrder = jest
    .fn<IOrdersRepository['update']>()
    .mockImplementation((value) => Promise.resolve(value));
  const execute = jest.fn<CommandBus['execute']>(() =>
    Promise.resolve({ id: 'audit-id' }),
  );
  const run = jest.fn<IUnitOfWork['run']>((work) => work());

  const handler = new HandleSepayIpnHandler(
    { run } as unknown as IUnitOfWork,
    {
      findByTransactionRef: findPayment,
      update: updatePayment,
    } as unknown as IPaymentsRepository,
    {
      findById: findOrder,
      update: updateOrder,
    } as unknown as IOrdersRepository,
    { execute } as unknown as CommandBus,
  );

  return {
    handler,
    payload,
    order,
    payment,
    findPayment,
    findOrder,
    updatePayment,
    updateOrder,
    execute,
  };
};

describe('HandleSepayIpnHandler', () => {
  it('settles the payment, marks the order paid and records an audit entry', async () => {
    const {
      handler,
      payload,
      payment,
      order,
      findPayment,
      findOrder,
      updatePayment,
      updateOrder,
      execute,
    } = setup();

    await expect(
      handler.execute(new HandleSepayIpnCommand(payload)),
    ).resolves.toBeUndefined();

    expect(findPayment).toHaveBeenCalledWith(TRANSACTION_REF, {
      forUpdate: true,
    });
    expect(findOrder).toHaveBeenCalledWith(payment.getOrderId(), {
      forUpdate: true,
    });
    expect(payment.getStatus()).toBe(PaymentStatus.SUCCESS);
    expect(payment.getSettlement()).toMatchObject({
      providerTransactionNo: '68ba94ac80123',
      payload: payload.raw,
    });
    expect(order.getPaymentStatus()).toBe(OrderPaymentStatus.PAID);
    expect(updatePayment).toHaveBeenCalledWith(payment);
    expect(updateOrder).toHaveBeenCalledWith(order);
    expect(execute).toHaveBeenCalledTimes(1);
    expect(execute.mock.calls[0]?.[0]).toBeInstanceOf(RecordAuditLogCommand);
  });

  it('acknowledges non-paid notifications without touching payment or order', async () => {
    const payload = createPayload();
    payload.notificationType = 'TRANSACTION_VOID';
    const { handler, findPayment, updatePayment, updateOrder, execute } = setup(
      { payload },
    );

    await handler.execute(new HandleSepayIpnCommand(payload));

    expect(findPayment).not.toHaveBeenCalled();
    expect(updatePayment).not.toHaveBeenCalled();
    expect(updateOrder).not.toHaveBeenCalled();
    expect(execute).not.toHaveBeenCalled();
  });

  it('rejects a non-approved transaction', async () => {
    const payload = createPayload();
    payload.transaction.status = 'DECLINED';
    const { handler, updatePayment } = setup({ payload });

    await expect(
      handler.execute(new HandleSepayIpnCommand(payload)),
    ).rejects.toThrow();
    expect(updatePayment).not.toHaveBeenCalled();
  });

  it('rejects an amount mismatch', async () => {
    const payload = createPayload();
    payload.transaction.amount = 99999n;
    const { handler } = setup({ payload });

    await expect(
      handler.execute(new HandleSepayIpnCommand(payload)),
    ).rejects.toBeInstanceOf(PaymentAmountMismatchException);
  });

  it('rejects an unknown invoice number', async () => {
    const { handler } = setup({ paymentFound: false });

    await expect(
      handler.execute(new HandleSepayIpnCommand(createPayload())),
    ).rejects.toBeInstanceOf(PaymentNotFoundException);
  });

  it('rejects a missing order', async () => {
    const { handler } = setup({ orderFound: false });

    await expect(
      handler.execute(new HandleSepayIpnCommand(createPayload())),
    ).rejects.toBeInstanceOf(OrderNotFoundException);
  });

  it('does not re-mark an already paid order on a retried IPN', async () => {
    const { handler, payload, payment, updateOrder, execute } = setup({
      orderAlreadyPaid: true,
    });
    payment.markSucceeded({
      providerTransactionNo: '68ba94ac80123',
      bankCode: null,
      responseCode: null,
      payload: payload.raw,
    });

    await handler.execute(new HandleSepayIpnCommand(payload));

    expect(updateOrder).not.toHaveBeenCalled();
    expect(execute).not.toHaveBeenCalled();
  });
});
