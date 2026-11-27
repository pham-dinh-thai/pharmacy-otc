import { describe, expect, it } from '@jest/globals';
import { PaymentProvider } from '../../domain/enums/payment-provider.enum';
import { PaymentStatus } from '../../domain/enums/payment-status.enum';
import { Payment } from '../../domain/payment.aggregate';
import { MikroPayment } from '../entities/mikro-payment.entity';
import { PaymentMapper } from './payment.mapper';

const ORDER_ID = '01931f7a-1c3e-7a61-8f0e-1c2d3e4f5a6c';

describe('PaymentMapper', () => {
  it('restores the SePay signature field order from legacy jsonb records', () => {
    const mikroPayment = Object.assign(new MikroPayment(), {
      id: '01931f7a-1c3e-7a61-8f0e-1c2d3e4f5a6d',
      orderId: ORDER_ID,
      provider: PaymentProvider.SEPAY,
      status: PaymentStatus.PENDING,
      amount: 25000n,
      transactionRef: 'DH0123456789',
      providerPayload: {
        gateway: {
          url: 'https://pay.example',
          fields: {
            currency: 'VND',
            operation: 'PURCHASE',
            merchant: 'SP-TEST',
            signature: 'signature',
          },
        },
      },
    });

    expect(PaymentMapper.toDomain(mikroPayment).getGateway()?.fields).toEqual([
      { name: 'operation', value: 'PURCHASE' },
      { name: 'currency', value: 'VND' },
      { name: 'merchant', value: 'SP-TEST' },
      { name: 'signature', value: 'signature' },
    ]);
  });

  it('persists gateway fields as an ordered array', () => {
    const fields = [
      { name: 'operation', value: 'PURCHASE' },
      { name: 'merchant', value: 'SP-TEST' },
      { name: 'signature', value: 'signature' },
    ];
    const payment = Payment.create({
      orderId: ORDER_ID,
      provider: PaymentProvider.SEPAY,
      amount: 25000n,
      transactionRef: 'DH0123456789',
      gateway: { url: 'https://pay.example', fields },
    });

    const mikroPayment = PaymentMapper.toMikro(payment);
    const payload = mikroPayment.providerPayload as {
      gateway: { fields: typeof fields };
    };

    expect(payload.gateway.fields).toEqual(fields);
  });
});
