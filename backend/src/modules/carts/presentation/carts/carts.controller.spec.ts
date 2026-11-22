import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import type { Request, Response } from 'express';
import { AddCartItemCommand } from '../../application/commands/add-cart-item/add-cart-item.command';
import { ClearCartCommand } from '../../application/commands/clear-cart/clear-cart.command';
import { RemoveCartItemCommand } from '../../application/commands/remove-cart-item/remove-cart-item.command';
import { SetCartItemQuantityCommand } from '../../application/commands/set-cart-item-quantity/set-cart-item-quantity.command';
import { GetCartQuery } from '../../application/queries/get-cart/get-cart.query';
import type { CartIdentity } from '../../domain/cart-identity';
import { CartIdentityResolver } from './cart-identity.resolver';
import { CartsController } from './carts.controller';
import { AddCartItemRequest } from './requests/add-cart-item.request';
import { UpdateCartItemRequest } from './requests/update-cart-item.request';

const PRODUCT_ID = '642b3190-9e97-4ce3-8533-894bc879b4fc';
const GUEST_TOKEN = '11111111-1111-4111-8111-111111111111';
const identity: CartIdentity = { guestToken: GUEST_TOKEN };
const request = {} as Request;
const response = {} as Response;

describe('CartsController', () => {
  let executeCommand: jest.Mock<(command: object) => Promise<unknown>>;
  let executeQuery: jest.Mock<(query: object) => Promise<unknown>>;
  let resolve: jest.Mock<
    (req: Request, res: Response) => Promise<CartIdentity>
  >;
  let controller: CartsController;

  beforeEach(() => {
    executeCommand = jest.fn<(command: object) => Promise<unknown>>(() =>
      Promise.resolve({ id: 'cart-id' }),
    );
    executeQuery = jest.fn<(query: object) => Promise<unknown>>(() =>
      Promise.resolve({ items: [] }),
    );
    resolve = jest.fn<(req: Request, res: Response) => Promise<CartIdentity>>(
      () => Promise.resolve(identity),
    );
    controller = new CartsController(
      { execute: executeCommand } as unknown as CommandBus,
      { execute: executeQuery } as unknown as QueryBus,
      { resolve } as unknown as CartIdentityResolver,
    );
  });

  it('dispatches GetCartQuery for a read', async () => {
    await expect(controller.getCart(request, response)).resolves.toEqual({
      items: [],
    });

    expect(executeQuery.mock.calls[0][0]).toEqual(new GetCartQuery(identity));
    expect(executeCommand).not.toHaveBeenCalled();
  });

  it('dispatches AddCartItemCommand then re-reads the cart', async () => {
    const body = Object.assign(new AddCartItemRequest(), {
      productId: PRODUCT_ID,
      quantity: 2,
    });

    await controller.addItem(request, response, body);

    expect(executeCommand.mock.calls[0][0]).toEqual(
      new AddCartItemCommand(identity, PRODUCT_ID, 2),
    );
    expect(executeQuery.mock.calls[0][0]).toEqual(new GetCartQuery(identity));
    expect(executeCommand.mock.invocationCallOrder[0]).toBeLessThan(
      executeQuery.mock.invocationCallOrder[0],
    );
  });

  it('dispatches SetCartItemQuantityCommand', async () => {
    const body = Object.assign(new UpdateCartItemRequest(), { quantity: 3 });

    await controller.setItemQuantity(request, response, PRODUCT_ID, body);

    expect(executeCommand.mock.calls[0][0]).toEqual(
      new SetCartItemQuantityCommand(identity, PRODUCT_ID, 3),
    );
    expect(executeQuery.mock.calls[0][0]).toEqual(new GetCartQuery(identity));
  });

  it('dispatches RemoveCartItemCommand', async () => {
    await controller.removeItem(request, response, PRODUCT_ID);

    expect(executeCommand.mock.calls[0][0]).toEqual(
      new RemoveCartItemCommand(identity, PRODUCT_ID),
    );
    expect(executeQuery.mock.calls[0][0]).toEqual(new GetCartQuery(identity));
  });

  it('dispatches ClearCartCommand', async () => {
    await controller.clearCart(request, response);

    expect(executeCommand.mock.calls[0][0]).toEqual(
      new ClearCartCommand(identity),
    );
    expect(executeQuery.mock.calls[0][0]).toEqual(new GetCartQuery(identity));
  });

  it('resolves the identity once per request', async () => {
    await controller.clearCart(request, response);

    expect(resolve).toHaveBeenCalledTimes(1);
    expect(resolve).toHaveBeenCalledWith(request, response);
  });
});
