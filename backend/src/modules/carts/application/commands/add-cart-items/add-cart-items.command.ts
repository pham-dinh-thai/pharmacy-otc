import { Command } from '@nestjs/cqrs';
import type { CartIdentity } from '../../../domain/cart-identity';

export type AddCartItemInput = {
  productId: string;
  quantity: number;
};

export class AddCartItemsCommand extends Command<{
  id: string;
  totalItems: number;
}> {
  public constructor(
    public readonly identity: CartIdentity,
    public readonly items: AddCartItemInput[],
  ) {
    super();
  }
}
