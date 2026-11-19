import { Command } from '@nestjs/cqrs';
import { type ActorHeaders } from '../../../../../shared/types/actor-headers';

export class UpdateProductCommand extends Command<{ id: string }> {
  public constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly unitPrice: string,
    public readonly quantity: number,
    public readonly categoryIds: string[],
    public readonly headers: ActorHeaders,
  ) {
    super();
  }
}
