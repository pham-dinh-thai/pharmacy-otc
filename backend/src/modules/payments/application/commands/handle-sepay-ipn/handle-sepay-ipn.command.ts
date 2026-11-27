import { Command } from '@nestjs/cqrs';

export type SepayIpnPayload = {
  raw: Record<string, unknown>;
  notificationType: string;
  order: {
    id: string;
    invoiceNumber: string;
    amount: bigint;
    status: string;
  };
  transaction: {
    id: string;
    transactionId: string | null;
    status: string;
    amount: bigint;
    paymentMethod: string | null;
    bankCode: string | null;
    responseCode: string | null;
  };
};

export class HandleSepayIpnCommand extends Command<void> {
  public constructor(public readonly payload: SepayIpnPayload) {
    super();
  }
}
