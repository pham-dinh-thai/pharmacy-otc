import { jest } from '@jest/globals';
import { CommandBus } from '@nestjs/cqrs';
import { Test } from '@nestjs/testing';
import { AuthGuard } from '../../../../shared/modules/security/auth.guard';
import { systemActorHeaders } from '../../../../shared/types/actor-headers';
import { CreateCheckoutCommand } from '../../application/commands/create-checkout/create-checkout.command';
import { CheckoutsController } from './checkouts.controller';
import { CreateCheckoutRequest } from './requests/create-checkout.request';

const PRODUCT_ID = '642b3190-9e97-4ce3-8533-894bc879b4fc';

describe('CheckoutsController', () => {
  let controller: CheckoutsController;
  let execute: jest.Mock<(command: unknown) => Promise<{ id: string }>>;

  beforeEach(async () => {
    execute = jest.fn(() => Promise.resolve({ id: 'checkout-id' }));

    const module = await Test.createTestingModule({
      controllers: [CheckoutsController],
      providers: [{ provide: CommandBus, useValue: { execute } }],
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
    };

    await expect(controller.create(request, headers)).resolves.toEqual({
      id: 'checkout-id',
    });
    expect(execute).toHaveBeenCalledWith(
      new CreateCheckoutCommand(
        headers.actorId,
        [PRODUCT_ID],
        request.shippingName,
        request.shippingAddress,
        request.shippingPhone,
        headers,
      ),
    );
  });
});
