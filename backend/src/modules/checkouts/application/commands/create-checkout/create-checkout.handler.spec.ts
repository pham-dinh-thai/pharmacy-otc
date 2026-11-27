import { describe, expect, it, jest } from '@jest/globals';
import { CommandBus } from '@nestjs/cqrs';
import { PaymentMethod } from '../../../../../shared/domain/enums/payment-method.enum';
import { systemActorHeaders } from '../../../../../shared/types/actor-headers';
import type { IUnitOfWork } from '../../../../../shared/modules/unit-of-work/unit-of-work';
import { RecordAuditLogCommand } from '../../../../audit-logs/application/commands/record-audit-log/record-audit-log.command';
import { EntityType } from '../../../../audit-logs/domain/enums/entity-type.enum';
import { Cart } from '../../../../carts/domain/cart.aggregate';
import type { ICartsRepository } from '../../../../carts/domain/carts.repository';
import type { CheckoutProductSnapshot } from '../../ports/checkout-catalog.port';
import type { ICheckoutCatalog } from '../../ports/checkout-catalog.port';
import type { ICheckoutRepository } from '../../../domain/checkouts.repository';
import {
  CheckoutProductNotInCartException,
  CheckoutProductNotFoundException,
  EmptyCheckoutException,
} from '../../../domain/exceptions/checkout.exception';
import { CreateCheckoutCommand } from './create-checkout.command';
import { CreateCheckoutHandler } from './create-checkout.handler';

const USER_ID = '9f7a1c3e-2b4d-4a61-8f0e-1c2d3e4f5a6b';
const PRODUCT_ID = '642b3190-9e97-4ce3-8533-894bc879b4fc';
const OTHER_PRODUCT_ID = '01931f7a-1c3e-7a61-8f0e-1c2d3e4f5a6b';
const UNIT_PRICE = 25000n;

const headers = systemActorHeaders();

const snapshot = (id: string): CheckoutProductSnapshot => ({
  productId: id,
  name: 'Product',
  sku: 'SKU',
  unitPrice: UNIT_PRICE,
});

const buildCart = (): Cart => {
  const cart = Cart.create({ userId: USER_ID });
  cart.addItem(PRODUCT_ID, 3);
  cart.addItem(OTHER_PRODUCT_ID, 1);

  return cart;
};

const setup = (
  cart: Cart | null = buildCart(),
  catalog = new Map([[PRODUCT_ID, snapshot(PRODUCT_ID)]]),
) => {
  const findByIdentity = jest
    .fn<ICartsRepository['findByIdentity']>()
    .mockResolvedValue(cart);
  const checkoutCreate = jest.fn<ICheckoutRepository['create']>((value) =>
    Promise.resolve(value),
  );
  const findByIds = jest
    .fn<ICheckoutCatalog['findByIds']>()
    .mockResolvedValue(catalog);
  const execute = jest.fn<CommandBus['execute']>().mockResolvedValue({
    id: 'audit-id',
  });
  const run = jest.fn<IUnitOfWork['run']>((work) => work());

  const handler = new CreateCheckoutHandler(
    { run } as unknown as IUnitOfWork,
    { create: checkoutCreate } as unknown as ICheckoutRepository,
    { findByIdentity } as unknown as ICartsRepository,
    { findByIds },
    { execute } as unknown as CommandBus,
  );

  const command = (productIds: string[] = [PRODUCT_ID]) =>
    new CreateCheckoutCommand(
      USER_ID,
      productIds,
      'Nguyen Van A',
      '1 Nguyen Hue',
      '0901234567',
      PaymentMethod.SEPAY,
      headers,
    );

  return {
    handler,
    command,
    findByIdentity,
    checkoutCreate,
    findByIds,
    execute,
    run,
  };
};

describe('CreateCheckoutHandler', () => {
  it('snapshots only selected cart items with catalog prices', async () => {
    const {
      handler,
      command,
      findByIdentity,
      checkoutCreate,
      findByIds,
      execute,
      run,
    } = setup();

    const result = await handler.execute(command());

    expect(run).toHaveBeenCalledTimes(1);
    expect(findByIdentity).toHaveBeenCalledWith(
      { userId: USER_ID },
      { forUpdate: true },
    );
    expect(findByIds).toHaveBeenCalledWith([PRODUCT_ID]);
    expect(checkoutCreate).toHaveBeenCalledTimes(1);
    expect(execute).toHaveBeenCalledTimes(1);

    const auditCommand = execute.mock.calls[0][0];

    expect(auditCommand).toBeInstanceOf(RecordAuditLogCommand);
    expect((auditCommand as RecordAuditLogCommand).props).toMatchObject({
      actorId: headers.actorId,
      action: 'create',
      entityType: EntityType.CHECKOUTS,
      metadata: {
        productIds: [PRODUCT_ID],
        lineCount: 1,
        amount: (UNIT_PRICE * 3n).toString(),
        paymentMethod: PaymentMethod.SEPAY,
      },
    });

    const checkout = checkoutCreate.mock.calls[0][0];

    expect(result.id).toBe(checkout.getId());
    expect(checkout.getUserId()).toBe(USER_ID);
    expect(checkout.getPaymentMethod()).toBe(PaymentMethod.SEPAY);
    expect(checkout.getLines()).toHaveLength(1);
    expect(checkout.getLines()[0].getProductId()).toBe(PRODUCT_ID);
    expect(checkout.getLines()[0].getProductName()).toBe('Product');
    expect(checkout.getLines()[0].getProductSku()).toBe('SKU');
    expect(checkout.getLines()[0].getUnitPrice()).toBe(UNIT_PRICE);
    expect(checkout.getLines()[0].getQuantity()).toBe(3);
    expect(checkout.getAmount()).toBe(UNIT_PRICE * 3n);
  });

  it('does not mutate the cart when creating a checkout', async () => {
    const cart = buildCart();
    const { handler, command } = setup(cart);

    await handler.execute(command());

    expect(cart.getItems()).toHaveLength(2);
  });

  it('rejects an empty selection', async () => {
    const { handler, command, checkoutCreate, execute } = setup();

    await expect(handler.execute(command([]))).rejects.toThrow(
      EmptyCheckoutException,
    );
    expect(checkoutCreate).not.toHaveBeenCalled();
    expect(execute).not.toHaveBeenCalled();
  });

  it('rejects a product that is not in the cart', async () => {
    const { handler, command, checkoutCreate, execute } = setup();

    await expect(
      handler.execute(command(['11111111-1111-4111-8111-111111111111'])),
    ).rejects.toThrow(CheckoutProductNotInCartException);
    expect(checkoutCreate).not.toHaveBeenCalled();
    expect(execute).not.toHaveBeenCalled();
  });

  it('rejects a product missing from the catalog', async () => {
    const { handler, command, checkoutCreate, execute } = setup(
      buildCart(),
      new Map(),
    );

    await expect(handler.execute(command())).rejects.toThrow(
      CheckoutProductNotFoundException,
    );
    expect(checkoutCreate).not.toHaveBeenCalled();
    expect(execute).not.toHaveBeenCalled();
  });
});
