import { jest } from '@jest/globals';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Test } from '@nestjs/testing';
import { PaymentMethod } from '../../../../shared/domain/enums/payment-method.enum';
import { AuthGuard } from '../../../../shared/modules/security/auth.guard';
import { systemActorHeaders } from '../../../../shared/types/actor-headers';
import { ConfirmCheckoutCommand } from '../../application/commands/confirm-checkout/confirm-checkout.command';
import { CreateCheckoutCommand } from '../../application/commands/create-checkout/create-checkout.command';
import { UpdateCheckoutCommand } from '../../application/commands/update-checkout/update-checkout.command';
import { CheckoutDetailReadModel } from '../../application/queries/get-checkout/checkout-detail.read-model';
import { GetCheckoutQuery } from '../../application/queries/get-checkout/get-checkout.query';
import { CheckoutStatus } from '../../domain/enums/checkout-status.enum';
import { CheckoutsController } from './checkouts.controller';
import { CreateCheckoutRequest } from './requests/create-checkout.request';
import { UpdateCheckoutRequest } from './requests/update-checkout.request';

const PRODUCT_ID = '642b3190-9e97-4ce3-8533-894bc879b4fc';

describe('CheckoutsController', () => {
  let controller: CheckoutsController;
  let execute: jest.Mock<
    (command: unknown) => Promise<{
      id: string;
      status?: CheckoutStatus;
      orderId?: string;
      paymentMode?: 'online' | 'offline';
      provider?: string | null;
    }>
  >;
  let query: jest.Mock<(query: unknown) => Promise<CheckoutDetailReadModel>>;

  beforeEach(async () => {
    execute = jest.fn(() =>
      Promise.resolve({
        id: 'checkout-id',
        status: CheckoutStatus.CONFIRMED,
        orderId: 'order-id',
        paymentMode: 'offline',
        provider: null,
      }),
    );
    const detail = new CheckoutDetailReadModel(
      'checkout-id',
      CheckoutStatus.PENDING,
      PaymentMethod.COD,
      'Nguyen Van A',
      '1 Nguyen Hue',
      '0901234567',
      '150000',
      new Date('2026-01-01T00:30:00.000Z'),
      new Date('2026-01-01T00:00:00.000Z'),
      [],
    );
    query = jest.fn(() => Promise.resolve(detail));

    const module = await Test.createTestingModule({
      controllers: [CheckoutsController],
      providers: [
        { provide: CommandBus, useValue: { execute } },
        { provide: QueryBus, useValue: { execute: query } },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get(CheckoutsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('dispatches create checkout with the authenticated user', async () => {
    const headers = systemActorHeaders();
    const request: CreateCheckoutRequest = {
      productIds: [PRODUCT_ID],
      shippingName: 'Nguyen Van A',
      shippingAddress: '1 Nguyen Hue',
      shippingPhone: '0901234567',
      paymentMethod: PaymentMethod.COD,
    };

    await expect(controller.create(request, headers)).resolves.toMatchObject({
      id: 'checkout-id',
    });
    expect(execute).toHaveBeenCalledWith(
      new CreateCheckoutCommand(
        headers.actorId,
        [PRODUCT_ID],
        request.shippingName,
        request.shippingAddress,
        request.shippingPhone,
        request.paymentMethod,
        headers,
      ),
    );
  });

  it('dispatches update checkout with the authenticated actor', async () => {
    const headers = systemActorHeaders();
    const checkoutId = '01931f7a-1c3e-7a61-8f0e-1c2d3e4f5a6b';
    const request: UpdateCheckoutRequest = {
      shippingName: 'Nguyen Van A',
      shippingAddress: '1 Nguyen Hue',
      shippingPhone: '0901234567',
      paymentMethod: PaymentMethod.SEPAY,
    };

    await expect(
      controller.update(checkoutId, request, headers),
    ).resolves.toMatchObject({ id: 'checkout-id' });
    expect(execute).toHaveBeenCalledWith(
      new UpdateCheckoutCommand(
        checkoutId,
        request.shippingName,
        request.shippingAddress,
        request.shippingPhone,
        request.paymentMethod,
        headers,
      ),
    );
  });

  it('dispatches get checkout with the authenticated actor', async () => {
    const headers = systemActorHeaders();
    const checkoutId = '01931f7a-1c3e-7a61-8f0e-1c2d3e4f5a6b';

    await expect(controller.getCheckout(checkoutId, headers)).resolves.toEqual(
      expect.objectContaining({ id: 'checkout-id' }),
    );
    expect(query).toHaveBeenCalledWith(
      new GetCheckoutQuery(checkoutId, headers),
    );
  });

  it('dispatches confirm checkout with the authenticated actor', async () => {
    const headers = systemActorHeaders();
    const checkoutId = '01931f7a-1c3e-7a61-8f0e-1c2d3e4f5a6b';

    await expect(controller.confirm(checkoutId, headers)).resolves.toEqual({
      id: 'checkout-id',
      status: CheckoutStatus.CONFIRMED,
      orderId: 'order-id',
      paymentMode: 'offline',
      provider: null,
    });
    expect(execute).toHaveBeenCalledWith(
      new ConfirmCheckoutCommand(checkoutId, headers),
    );
  });
});
