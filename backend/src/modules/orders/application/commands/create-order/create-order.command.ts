import { Command } from '@nestjs/cqrs';
import type { ActorHeaders } from '../../../../../shared/types/actor-headers';

export type CreateOrderLineInput = {
  productId: string;
  productName: string;
  productSku: string | null;
  unitPrice: bigint;
  quantity: number;
};

export class CreateOrderCommand extends Command<{ id: string }> {
  public constructor(
    public readonly checkoutId: string,
    public readonly userId: string,
    public readonly lines: CreateOrderLineInput[],
    public readonly shippingName: string,
    public readonly shippingAddress: string,
    public readonly shippingPhone: string,
    public readonly shippingFee: bigint,
    public readonly note: string | null,
    public readonly headers: ActorHeaders,
  ) {
    super();
  }
}
