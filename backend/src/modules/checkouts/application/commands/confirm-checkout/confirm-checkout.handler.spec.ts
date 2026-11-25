import { describe, expect, it, jest } from '@jest/globals';
import { CommandBus } from '@nestjs/cqrs';
import type { IUnitOfWork } from '../../../../../shared/modules/unit-of-work/unit-of-work';
import { systemActorHeaders } from '../../../../../shared/types/actor-headers';
import { RecordAuditLogCommand } from '../../../../audit-logs/application/commands/record-audit-log/record-audit-log.command';
import { EntityType } from '../../../../audit-logs/domain/enums/entity-type.enum';
import { Cart } from '../../../../carts/domain/cart.aggregate';
import type { ICartsRepository } from '../../../../carts/domain/carts.repository';
import { CreateOrderCommand } from '../../../../orders/application/commands/create-order/create-order.command';
import { Checkout } from '../../../domain/checkout.aggregate';
import { CheckoutLine } from '../../../domain/checkout-line.entity';
import type { ICheckoutRepository } from '../../../domain/checkouts.repository';
import { CheckoutStatus } from '../../../domain/enums/checkout-status.enum';
import { CheckoutNotFoundException } from '../../../domain/exceptions/checkout.exception';
import { ConfirmCheckoutCommand } from './confirm-checkout.command';
import { ConfirmCheckoutHandler } from './confirm-checkout.handler';

const USER_ID = '9f7a1c3e-2b4d-4a61-8f0e-1c2d3e4f5a6b';
const PRODUCT_ID = '642b3190-9e97-4ce3-8533-894bc879b4fc';
const CHECKOUT_ID = '01931f7a-1c3e-7a61-8f0e-1c2d3e4f5a6b';
const ORDER_ID = '01931f7a-1c3e-7a61-8f0e-1c2d3e4f5a6c';

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
  });

const buildCart = (): Cart => {
  const cart = Cart.create({ userId: USER_ID });
  cart.addItem(PRODUCT_ID, 2);

  return cart;
};

const setup = (
  checkout: Checkout | null = buildCheckout(),
  cart: Cart | null = buildCart(),
) => {
  const findById = jest
    .fn<ICheckoutRepository['findById']>()
    .mockResolvedValue(checkout);
  const update = jest.fn<ICheckoutRepository['update']>((value) =>
    Promise.resolve(value),
  );
  const findCartByIdentity = jest
    .fn<ICartsRepository['findByIdentity']>()
    .mockResolvedValue(cart);
  const updateCart = jest.fn<ICartsRepository['update']>((value) =>
    Promise.resolve(value),
  );
  const execute = jest.fn<CommandBus['execute']>((command) => {
    if (command instanceof CreateOrderCommand) {
      return Promise.resolve({ id: ORDER_ID });
    }

    return Promise.resolve({ id: 'audit-id' });
  });
  const run = jest.fn<IUnitOfWork['run']>((work) => work());

  const handler = new ConfirmCheckoutHandler(
    { run } as unknown as IUnitOfWork,
    { findById, update } as unknown as ICheckoutRepository,
    {
      findByIdentity: findCartByIdentity,
      update: updateCart,
    } as unknown as ICartsRepository,
    { execute } as unknown as CommandBus,
  );

  return {
    handler,
    findById,
    update,
    findCartByIdentity,
    updateCart,
    execute,
    run,
  };
};

describe('ConfirmCheckoutHandler', () => {
  it('confirms the checkout, creates an order, clears the cart and records audit in one UoW', async () => {
    const checkout = buildCheckout();
    const cart = buildCart();
    const {
      handler,
      findById,
      update,
      findCartByIdentity,
      updateCart,
      execute,
      run,
    } = setup(checkout, cart);

    const result = await handler.execute(
      new ConfirmCheckoutCommand(checkout.getId(), headers),
    );

    expect(run).toHaveBeenCalledTimes(1);
    expect(findById).toHaveBeenCalledWith(checkout.getId(), {
      forUpdate: true,
    });
    expect(checkout.getStatus()).toBe(CheckoutStatus.CONFIRMED);
    expect(update).toHaveBeenCalledWith(checkout);

    expect(findCartByIdentity).toHaveBeenCalledWith(
      { userId: USER_ID },
      { forUpdate: true },
    );
    expect(updateCart).toHaveBeenCalledWith(cart);
    expect(cart.getItems()).toHaveLength(0);

    expect(execute).toHaveBeenCalledTimes(2);

    const createOrderCommand = execute.mock.calls
      .map(([command]) => command)
      .find(
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

    const auditCommand = execute.mock.calls
      .map(([command]) => command)
      .find(
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
    });
  });

  it('does not create a cart when the user has none', async () => {
    const checkout = buildCheckout();
    const { handler, findCartByIdentity, updateCart } = setup(checkout, null);

    await expect(
      handler.execute(new ConfirmCheckoutCommand(checkout.getId(), headers)),
    ).resolves.toMatchObject({ orderId: ORDER_ID });
    expect(findCartByIdentity).toHaveBeenCalledTimes(1);
    expect(updateCart).not.toHaveBeenCalled();
  });

  it('rejects a missing checkout without writing anything', async () => {
    const { handler, update, findCartByIdentity, updateCart, execute } =
      setup(null);

    await expect(
      handler.execute(new ConfirmCheckoutCommand(CHECKOUT_ID, headers)),
    ).rejects.toBeInstanceOf(CheckoutNotFoundException);
    expect(update).not.toHaveBeenCalled();
    expect(findCartByIdentity).not.toHaveBeenCalled();
    expect(updateCart).not.toHaveBeenCalled();
    expect(execute).not.toHaveBeenCalled();
  });

  it('rejects a checkout owned by another user', async () => {
    const { handler, update, findCartByIdentity, updateCart, execute } = setup(
      buildCheckout('other-user'),
    );

    await expect(
      handler.execute(new ConfirmCheckoutCommand(CHECKOUT_ID, headers)),
    ).rejects.toBeInstanceOf(CheckoutNotFoundException);
    expect(update).not.toHaveBeenCalled();
    expect(findCartByIdentity).not.toHaveBeenCalled();
    expect(updateCart).not.toHaveBeenCalled();
    expect(execute).not.toHaveBeenCalled();
  });
});
