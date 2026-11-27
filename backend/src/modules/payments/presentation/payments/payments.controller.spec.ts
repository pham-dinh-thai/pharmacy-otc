import { jest } from '@jest/globals';
import { QueryBus } from '@nestjs/cqrs';
import { Test } from '@nestjs/testing';
import { AuthGuard } from '../../../../shared/modules/security/auth.guard';
import { systemActorHeaders } from '../../../../shared/types/actor-headers';
import { GetPaymentGatewayQuery } from '../../application/queries/get-payment-gateway/get-payment-gateway.query';
import { PaymentsController } from './payments.controller';

describe('PaymentsController', () => {
  let controller: PaymentsController;
  let query: jest.Mock<(query: unknown) => Promise<unknown>>;

  beforeEach(async () => {
    query = jest.fn(() => Promise.resolve({ orderId: 'order-id' }));

    const module = await Test.createTestingModule({
      controllers: [PaymentsController],
      providers: [{ provide: QueryBus, useValue: { execute: query } }],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get(PaymentsController);
  });

  it('queries the gateway for the authenticated order owner', async () => {
    const headers = { ...systemActorHeaders(), actorId: 'user-id' };

    await expect(controller.getGateway('order-id', headers)).resolves.toEqual({
      orderId: 'order-id',
    });
    expect(query).toHaveBeenCalledWith(
      new GetPaymentGatewayQuery('order-id', 'user-id'),
    );
  });
});
