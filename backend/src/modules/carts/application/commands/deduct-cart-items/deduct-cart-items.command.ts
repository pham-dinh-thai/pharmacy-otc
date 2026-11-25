import { Command } from '@nestjs/cqrs';
import type { CartIdentity } from '../../../domain/cart-identity';

export type DeductCartItem = {
  productId: string;
  quantity: number;
};

export class DeductCartItemsCommand extends Command<{ changed: boolean }> {
  public constructor(
    public readonly identity: CartIdentity,
    public readonly items: DeductCartItem[],
  ) {
    super();
  }
}
