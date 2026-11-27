import { describe, expect, it, jest } from '@jest/globals';
import { CommandBus } from '@nestjs/cqrs';
import { PaymentMethod } from '../../../../../shared/domain/enums/payment-method.enum';
import type { IUnitOfWork } from '../../../../../shared/modules/unit-of-work/unit-of-work';
import { systemActorHeaders } from '../../../../../shared/types/actor-headers';
import { RecordAuditLogCommand } from '../../../../audit-logs/application/commands/record-audit-log/record-audit-log.command';
import { EntityType } from '../../../../audit-logs/domain/enums/entity-type.enum';
import { Checkout } from '../../../domain/checkout.aggregate';
import { CheckoutLine } from '../../../domain/checkout-line.entity';
import type { ICheckoutRepository } from '../../../domain/checkouts.repository';
import { CheckoutStatus } from '../../../domain/enums/checkout-status.enum';
import { CheckoutNotFoundException } from '../../../domain/exceptions/checkout.exception';
import { UpdateCheckoutCommand } from './update-checkout.command';
import { UpdateCheckoutHandler } from './update-checkout.handler';

const USER_ID = '9f7a1c3e-2b4d-4a61-8f0e-1c2d3e4f5a6b';
const PRODUCT_ID = '642b3190-9e97-4ce3-8533-894bc879b4fc';

const headers = { ...systemActorHeaders(), actorId: USER_ID };

const buildCheckout = (userId = USER_ID): Checkout =>
  Checkout.create({
    userId,
    lines: [
      CheckoutLine.create({
        productId: PRODUCT_ID,
        productName: 'Paracetamol 500mg',
        productSku: 'SKU-001',
        unitPrice: 25000n,
        quantity: 1,
      }),
    ],
    shippingName: 'Nguyen Van A',
    shippingAddress: '1 Nguyen Hue',
    shippingPhone: '0901234567',
    paymentMethod: PaymentMethod.COD,
  });

const setup = (checkout: Checkout | null = buildCheckout()) => {
  const findById = jest
    .fn<ICheckoutRepository['findById']>()
    .mockResolvedValue(checkout);
  const update = jest.fn<ICheckoutRepository['update']>((value) =>
    Promise.resolve(value),
  );
  const execute = jest.fn<CommandBus['execute']>(() =>
    Promise.resolve({ id: 'audit-id' }),
  );
  const run = jest.fn<IUnitOfWork['run']>((work) => work());

  const handler = new UpdateCheckoutHandler(
    { run } as unknown as IUnitOfWork,
    { findById, update } as unknown as ICheckoutRepository,
    { execute } as unknown as CommandBus,
  );

  return { handler, findById, update, execute, run };
};

describe('UpdateCheckoutHandler', () => {
  it('updates shipping details and payment method, then marks the checkout as confirming', async () => {
    const checkout = buildCheckout();
    const { handler, findById, update, execute, run } = setup(checkout);

    const result = await handler.execute(
      new UpdateCheckoutCommand(
        checkout.getId(),
        'Tran Thi B',
        '2 Le Loi',
        '0912345678',
        PaymentMethod.SEPAY,
        headers,
      ),
    );

    expect(run).toHaveBeenCalledTimes(1);
    expect(findById).toHaveBeenCalledWith(checkout.getId(), {
      forUpdate: true,
    });
    expect(checkout.getShippingName()).toBe('Tran Thi B');
    expect(checkout.getShippingAddress()).toBe('2 Le Loi');
    expect(checkout.getShippingPhone()).toBe('0912345678');
    expect(checkout.getPaymentMethod()).toBe(PaymentMethod.SEPAY);
    expect(checkout.getStatus()).toBe(CheckoutStatus.CONFIRMING);
    expect(checkout.getConfirmingAt()).toBeInstanceOf(Date);
    expect(update).toHaveBeenCalledWith(checkout);

    const auditCommand = execute.mock.calls[0]?.[0];
    expect(auditCommand).toBeInstanceOf(RecordAuditLogCommand);
    expect((auditCommand as RecordAuditLogCommand).props).toMatchObject({
      actorId: USER_ID,
      action: 'update',
      entityType: EntityType.CHECKOUTS,
      entityId: checkout.getId(),
      before: {
        shippingName: 'Nguyen Van A',
        paymentMethod: PaymentMethod.COD,
        status: CheckoutStatus.PENDING,
      },
      after: {
        shippingName: 'Tran Thi B',
        paymentMethod: PaymentMethod.SEPAY,
        status: CheckoutStatus.CONFIRMING,
      },
    });
    expect(result).toEqual({ id: checkout.getId() });
  });

  it('rejects a missing checkout without writing anything', async () => {
    const { handler, update, execute } = setup(null);

    await expect(
      handler.execute(
        new UpdateCheckoutCommand(
          '01931f7a-1c3e-7a61-8f0e-1c2d3e4f5a6b',
          'Tran Thi B',
          '2 Le Loi',
          '0912345678',
          PaymentMethod.COD,
          headers,
        ),
      ),
    ).rejects.toBeInstanceOf(CheckoutNotFoundException);
    expect(update).not.toHaveBeenCalled();
    expect(execute).not.toHaveBeenCalled();
  });

  it('rejects a checkout owned by another user', async () => {
    const { handler, update, execute } = setup(buildCheckout('other-user'));

    await expect(
      handler.execute(
        new UpdateCheckoutCommand(
          '01931f7a-1c3e-7a61-8f0e-1c2d3e4f5a6b',
          'Tran Thi B',
          '2 Le Loi',
          '0912345678',
          PaymentMethod.COD,
          headers,
        ),
      ),
    ).rejects.toBeInstanceOf(CheckoutNotFoundException);
    expect(update).not.toHaveBeenCalled();
    expect(execute).not.toHaveBeenCalled();
  });
});
