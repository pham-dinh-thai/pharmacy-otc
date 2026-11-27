import { describe, expect, it, jest } from '@jest/globals';
import { CommandBus } from '@nestjs/cqrs';
import { HandleSepayIpnCommand } from '../../application/commands/handle-sepay-ipn/handle-sepay-ipn.command';
import { parseSepayIpn } from '../../infrastructure/sepay/sepay-ipn.mapper';
import { SepayIpnController } from './sepay-ipn.controller';

const body = {
  notification_type: 'ORDER_PAID',
  order: {
    id: 'sepay-order-uuid',
    order_invoice_number: 'DH0123456789',
    order_status: 'CAPTURED',
    order_amount: '25000',
  },
  transaction: {
    id: 'sepay-transaction-uuid',
    transaction_id: '68ba94ac80123',
    transaction_status: 'APPROVED',
    transaction_amount: '25000',
    payment_method: 'BANK_TRANSFER',
  },
};

describe('SepayIpnController', () => {
  it('parses the body and dispatches the IPN command', async () => {
    const execute = jest.fn<CommandBus['execute']>(() => Promise.resolve());
    const controller = new SepayIpnController({
      execute,
    } as unknown as CommandBus);

    await expect(controller.handle(body)).resolves.toEqual({ success: true });
    expect(execute).toHaveBeenCalledWith(
      new HandleSepayIpnCommand(parseSepayIpn(body)),
    );
  });

  it('rejects an invalid body before dispatching', async () => {
    const execute = jest.fn<CommandBus['execute']>(() => Promise.resolve());
    const controller = new SepayIpnController({
      execute,
    } as unknown as CommandBus);

    await expect(controller.handle({})).rejects.toThrow();
    expect(execute).not.toHaveBeenCalled();
  });
});
