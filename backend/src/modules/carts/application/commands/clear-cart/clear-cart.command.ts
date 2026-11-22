import { Command } from '@nestjs/cqrs';
import type { CartIdentity } from '../../../domain/cart-identity';

export class ClearCartCommand extends Command<{ id: string }> {
  public constructor(public readonly identity: CartIdentity) {
    super();
  }
}
