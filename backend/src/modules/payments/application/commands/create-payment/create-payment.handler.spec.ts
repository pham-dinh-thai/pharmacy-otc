import { describe, expect, it, jest } from '@jest/globals';
import { CommandBus } from '@nestjs/cqrs';
import { systemActorHeaders } from '../../../../../shared/types/actor-headers';
import type { IUnitOfWork } from '../../../../../shared/modules/unit-of-work/unit-of-work';
import { RecordAuditLogCommand } from '../../../../audit-logs/application/commands/record-audit-log/record-audit-log.command';
import { PaymentProvider } from '../../../domain/enums/payment-provider.enum';
import { PaymentStatus } from '../../../domain/enums/payment-status.enum';
import type { IPaymentsRepository } from '../../../domain/payments.repository';
import { CreatePaymentCommand } from './create-payment.command';
import { CreatePaymentHandler } from './create-payment.handler';

const ORDER_ID = '01931f7a-1c3e-7a61-8f0e-1c2d3e4f5a6c';

describe('CreatePaymentHandler', () => {
  it('persists a pending payment and records an audit entry', async () => {
    const create = jest
      .fn<IPaymentsRepository['create']>()
      .mockImplementation((payment) => Promise.resolve(payment));
    const execute = jest.fn<CommandBus['execute']>(() =>
      Promise.resolve({ id: 'audit-id' }),
    );
    const run = jest.fn<IUnitOfWork['run']>((work) => work());
    const handler = new CreatePaymentHandler(
      { run } as unknown as IUnitOfWork,
      { create } as unknown as IPaymentsRepository,
      { execute } as unknown as CommandBus,
    );
    const headers = systemActorHeaders();
    const gateway = {
      url: 'https://pay.example',
      fields: [{ name: 'merchant', value: 'id' }],
    };

    const result = await handler.execute(
      new CreatePaymentCommand(
        ORDER_ID,
        PaymentProvider.SEPAY,
        25000n,
        'DH0123456789',
        gateway,
        headers,
      ),
    );

    expect(run).toHaveBeenCalledTimes(1);
    const payment = create.mock.calls[0]?.[0];
    expect(payment.getOrderId()).toBe(ORDER_ID);
    expect(payment.getProvider()).toBe(PaymentProvider.SEPAY);
    expect(payment.getAmount()).toBe(25000n);
    expect(payment.getTransactionRef()).toBe('DH0123456789');
    expect(payment.getGateway()).toEqual(gateway);
    expect(payment.getStatus()).toBe(PaymentStatus.PENDING);
    expect(execute.mock.calls[0]?.[0]).toBeInstanceOf(RecordAuditLogCommand);
    expect(result).toEqual({ id: payment.getId() });
  });
});
