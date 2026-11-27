import { describe, expect, it, jest } from '@jest/globals';
import { CommandBus } from '@nestjs/cqrs';
import { PaymentMethod } from '../../../../../shared/domain/enums/payment-method.enum';
import type { IUnitOfWork } from '../../../../../shared/modules/unit-of-work/unit-of-work';
import { systemActorHeaders } from '../../../../../shared/types/actor-headers';
import { RecordAuditLogCommand } from '../../../../audit-logs/application/commands/record-audit-log/record-audit-log.command';
import { EntityType } from '../../../../audit-logs/domain/enums/entity-type.enum';
import { DeductCartItemsCommand } from '../../../../carts/application/commands/deduct-cart-items/deduct-cart-items.command';
import { CreateOrderCommand } from '../../../../orders/application/commands/create-order/create-order.command';
import { PaymentProvider } from '../../../../payments/domain/enums/payment-provider.enum';
import { Checkout } from '../../../domain/checkout.aggregate';
import { CheckoutLine } from '../../../domain/checkout-line.entity';
import type { ICheckoutRepository } from '../../../domain/checkouts.repository';
import { CheckoutStatus } from '../../../domain/enums/checkout-status.enum';
import { CheckoutNotFoundException } from '../../../domain/exceptions/checkout.exception';
import { ConfirmCheckoutCommand } from './confirm-checkout.command';
import { ConfirmCheckoutHandler } from './confirm-checkout.handler';
import type { OnlinePaymentRequestStrategyResolver } from './strategies/online-payment-request.strategy-resolver';
import type {
  PaymentRequestInput,
  PaymentRequestResult,
} from './strategies/online-payment-request.strategy';

const USER_ID = '9f7a1c3e-2b4d-4a61-8f0e-1c2d3e4f5a6b';
const PRODUCT_ID = '642b3190-9e97-4ce3-8533-894bc879b4fc';
const CHECKOUT_ID = '01931f7a-1c3e-7a61-8f0e-1c2d3e4f5a6b';
const ORDER_ID = '01931f7a-1c3e-7a61-8f0e-1c2d3e4f5a6c';

const headers = { ...systemActorHeaders(), actorId: USER_ID };

const buildCheckout = (userId = USER_ID, quantity = 1): Checkout =>
  Checkout.create({
    userId,
    lines: [
      CheckoutLine.create({
        productId: PRODUCT_ID,
        productName: 'Paracetamol 500mg',
        productSku: 'SKU-001',
        unitPrice: 25000n,
        quantity,
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
  const execute = jest.fn<CommandBus['execute']>((command) => {
    if (command instanceof CreateOrderCommand) {
      return Promise.resolve({ id: ORDER_ID });
    }
    if (command instanceof DeductCartItemsCommand) {
      return Promise.resolve({ changed: true });
    }

    return Promise.resolve({ id: 'audit-id' });
  });
  const run = jest.fn<IUnitOfWork['run']>((work) => work());
  const resolve = jest.fn<OnlinePaymentRequestStrategyResolver['resolve']>();

  const handler = new ConfirmCheckoutHandler(
    { run } as unknown as IUnitOfWork,
    { findById, update } as unknown as ICheckoutRepository,
    { execute } as unknown as CommandBus,
    { resolve } as unknown as OnlinePaymentRequestStrategyResolver,
  );

  return { handler, findById, update, execute, run, resolve };
};

describe('ConfirmCheckoutHandler', () => {
  it('confirms the checkout, dispatches order, cart deduction and audit in one UoW', async () => {
    const checkout = buildCheckout();
    const { handler, findById, update, execute, run } = setup(checkout);

    const result = await handler.execute(
      new ConfirmCheckoutCommand(checkout.getId(), headers),
    );

    expect(run).toHaveBeenCalledTimes(1);
    expect(findById).toHaveBeenCalledWith(checkout.getId(), {
      forUpdate: true,
    });
    expect(checkout.getStatus()).toBe(CheckoutStatus.CONFIRMED);
    expect(update).toHaveBeenCalledWith(checkout);
    expect(execute).toHaveBeenCalledTimes(3);

    const commands = execute.mock.calls.map(([command]) => command);
    const createOrderCommand = commands.find(
      (command): command is CreateOrderCommand =>
        command instanceof CreateOrderCommand,
    );
    expect(createOrderCommand).toBeInstanceOf(CreateOrderCommand);
    expect(createOrderCommand).toMatchObject({
      checkoutId: checkout.getId(),
      userId: USER_ID,
      lines: [
        {
          productId: PRODUCT_ID,
          productName: 'Paracetamol 500mg',
          productSku: 'SKU-001',
          unitPrice: 25000n,
          quantity: 1,
        },
      ],
      shippingName: 'Nguyen Van A',
      shippingAddress: '1 Nguyen Hue',
      shippingPhone: '0901234567',
      shippingFee: 0n,
      note: null,
      headers,
    });

    const deductCartCommand = commands.find(
      (command): command is DeductCartItemsCommand =>
        command instanceof DeductCartItemsCommand,
    );
    expect(deductCartCommand).toBeInstanceOf(DeductCartItemsCommand);
    expect(deductCartCommand).toMatchObject({
      identity: { userId: USER_ID },
      items: [{ productId: PRODUCT_ID, quantity: 1 }],
    });

    const auditCommand = commands.find(
      (command): command is RecordAuditLogCommand =>
        command instanceof RecordAuditLogCommand,
    );
    expect(auditCommand).toBeInstanceOf(RecordAuditLogCommand);
    expect(auditCommand?.props).toMatchObject({
      actorId: USER_ID,
      action: 'confirm',
      entityType: EntityType.CHECKOUTS,
      entityId: checkout.getId(),
      before: { status: CheckoutStatus.PENDING },
      after: { status: CheckoutStatus.CONFIRMED, orderId: ORDER_ID },
    });

    expect(result).toEqual({
      id: checkout.getId(),
      status: CheckoutStatus.CONFIRMED,
      orderId: ORDER_ID,
      paymentMode: 'offline',
      provider: null,
    });
  });

  it('confirms a checkout after its details were saved as confirming', async () => {
    const checkout = buildCheckout();
    checkout.update({
      shippingName: 'Nguyen Van A',
      shippingAddress: '1 Nguyen Hue',
      shippingPhone: '0901234567',
      paymentMethod: PaymentMethod.COD,
    });
    const { handler, execute } = setup(checkout);

    await handler.execute(
      new ConfirmCheckoutCommand(checkout.getId(), headers),
    );

    expect(checkout.getStatus()).toBe(CheckoutStatus.CONFIRMED);
    const commands = execute.mock.calls.map(([command]) => command);
    const auditCommand = commands.find(
      (command): command is RecordAuditLogCommand =>
        command instanceof RecordAuditLogCommand,
    );
    expect(auditCommand?.props).toMatchObject({
      before: { status: CheckoutStatus.CONFIRMING },
      after: { status: CheckoutStatus.CONFIRMED, orderId: ORDER_ID },
    });
  });

  it('forwards checkout snapshot quantities to the cart deduction command', async () => {
    const checkout = buildCheckout(USER_ID, 2);
    const { handler, execute } = setup(checkout);

    await handler.execute(
      new ConfirmCheckoutCommand(checkout.getId(), headers),
    );

    const commands = execute.mock.calls.map(([command]) => command);
    expect(
      commands.find(
        (command): command is DeductCartItemsCommand =>
          command instanceof DeductCartItemsCommand,
      ),
    ).toMatchObject({
      identity: { userId: USER_ID },
      items: [{ productId: PRODUCT_ID, quantity: 2 }],
    });
  });

  it('resolves an online strategy before deducting cart items', async () => {
    const checkout = buildCheckout();
    checkout.update({
      shippingName: 'Nguyen Van A',
      shippingAddress: '1 Nguyen Hue',
      shippingPhone: '0901234567',
      paymentMethod: PaymentMethod.SEPAY,
    });
    const { handler, resolve, execute } = setup(checkout);
    const buildRequest = jest
      .fn<(input: PaymentRequestInput) => Promise<PaymentRequestResult>>()
      .mockResolvedValue({
        provider: PaymentProvider.SEPAY,
        transactionRef: 'DH0123456789',
        gateway: {
          url: 'https://pay.example',
          fields: [{ name: 'merchant', value: 'id' }],
        },
      });
    resolve.mockReturnValue({
      paymentMethod: PaymentMethod.SEPAY,
      buildRequest,
    });

    const result = await handler.execute(
      new ConfirmCheckoutCommand(checkout.getId(), headers),
    );

    expect(resolve).toHaveBeenCalledWith(PaymentMethod.SEPAY);
    expect(buildRequest).toHaveBeenCalledWith({
      orderId: ORDER_ID,
      amount: 25000n,
      headers,
    });
    expect(result).toMatchObject({ paymentMode: 'online', provider: 'sepay' });
    expect(
      execute.mock.calls
        .map(([command]) => command)
        .some((command) => command instanceof DeductCartItemsCommand),
    ).toBe(true);
  });

  it('does not resolve a strategy for cash on delivery', async () => {
    const { handler, resolve } = setup();

    await handler.execute(new ConfirmCheckoutCommand(CHECKOUT_ID, headers));

    expect(resolve).not.toHaveBeenCalled();
  });

  it('rejects a missing checkout without writing anything', async () => {
    const { handler, update, execute } = setup(null);

    await expect(
      handler.execute(new ConfirmCheckoutCommand(CHECKOUT_ID, headers)),
    ).rejects.toBeInstanceOf(CheckoutNotFoundException);
    expect(update).not.toHaveBeenCalled();
    expect(execute).not.toHaveBeenCalled();
  });

  it('rejects a checkout owned by another user', async () => {
    const { handler, update, execute } = setup(buildCheckout('other-user'));

    await expect(
      handler.execute(new ConfirmCheckoutCommand(CHECKOUT_ID, headers)),
    ).rejects.toBeInstanceOf(CheckoutNotFoundException);
    expect(update).not.toHaveBeenCalled();
    expect(execute).not.toHaveBeenCalled();
  });
});
