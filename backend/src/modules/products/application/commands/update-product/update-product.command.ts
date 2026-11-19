import { Command } from '@nestjs/cqrs';
import { type ActorHeaders } from '../../../../../shared/types/actor-headers';
import type { ProductCommandDetails } from '../create-product/create-product.command';

export class UpdateProductCommand extends Command<{ id: string }> {
  public constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly unitPrice: string,
    public readonly quantity: number,
    public readonly categoryIds: string[],
    public readonly headers: ActorHeaders,
    public readonly details: ProductCommandDetails = {},
  ) {
    super();
  }
}
