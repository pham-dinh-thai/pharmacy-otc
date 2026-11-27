import { describe, expect, it, jest } from '@jest/globals';
import { ConfigService } from '@nestjs/config';
import { CommandBus } from '@nestjs/cqrs';
import { systemActorHeaders } from '../../../../../../shared/types/actor-headers';
import { CreatePaymentCommand } from '../../../../../payments/application/commands/create-payment/create-payment.command';
import { PaymentProvider } from '../../../../../payments/domain/enums/payment-provider.enum';
import { paymentReferenceForOrder } from '../../../../../payments/domain/payment-reference';
import { SepayPaymentRequestStrategy } from './sepay-payment-request.strategy';

const ORDER_ID = '01931f7a-1c3e-7a61-8f0e-1c2d3e4f5a6c';

describe('SepayPaymentRequestStrategy', () => {
  it('creates a pending payment and returns the gateway form', async () => {
    const execute = jest
      .fn<CommandBus['execute']>()
      .mockResolvedValue({ id: 'payment-id' });
    const config = {
      get: jest.fn(() => 'sandbox'),
      getOrThrow: jest.fn((key: string) =>
        key === 'PAYMENT_RETURN_URL' ? 'https://example.com/orders' : key,
      ),
    };
    const strategy = new SepayPaymentRequestStrategy(
      config as unknown as ConfigService,
      { execute } as unknown as CommandBus,
    );
    const headers = systemActorHeaders();

    const result = await strategy.buildRequest({
      orderId: ORDER_ID,
      amount: 25000n,
      headers,
    });

    expect(result.provider).toBe(PaymentProvider.SEPAY);
    expect(result.transactionRef).toBe(paymentReferenceForOrder(ORDER_ID));
    expect(result.gateway.url).toContain('sepay.vn');
    expect(result.gateway.fields).toEqual(
      expect.arrayContaining([
        { name: 'order_invoice_number', value: result.transactionRef },
        { name: 'order_amount', value: '25000' },
        { name: 'signature', value: expect.any(String) },
      ]),
    );
    expect(execute.mock.calls[0]?.[0]).toBeInstanceOf(CreatePaymentCommand);
    expect(execute.mock.calls[0]?.[0]).toMatchObject({
      orderId: ORDER_ID,
      provider: PaymentProvider.SEPAY,
      amount: 25000n,
      transactionRef: result.transactionRef,
      headers,
    });
  });
});
