import { Query } from '@nestjs/cqrs';
import type { CartIdentity } from '../../../domain/cart-identity';
import { CartReadModel } from '../../cart.read-model';

export class GetCartQuery extends Query<CartReadModel> {
  public constructor(public readonly identity: CartIdentity) {
    super();
  }
}
