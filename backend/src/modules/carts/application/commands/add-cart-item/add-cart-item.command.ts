import { Command } from '@nestjs/cqrs';
import type { CartIdentity } from '../../../domain/cart-identity';

export class AddCartItemCommand extends Command<{ id: string }> {
  public constructor(
    public readonly identity: CartIdentity,
    public readonly productId: string,
    public readonly quantity: number,
  ) {
    super();
  }
}
