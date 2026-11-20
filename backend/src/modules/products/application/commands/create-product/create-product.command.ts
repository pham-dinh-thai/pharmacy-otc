import { Command } from '@nestjs/cqrs';
import { type ActorHeaders } from '../../../../../shared/types/actor-headers';

export type ProductCommandDetails = {
  sku?: string | null;
  unit?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  warning?: string | null;
};

export class CreateProductCommand extends Command<{ id: string }> {
  public constructor(
    public readonly name: string,
    public readonly unitPrice: string,
    public readonly categoryIds: string[],
    public readonly headers: ActorHeaders,
    public readonly details: ProductCommandDetails = {},
  ) {
    super();
  }
}
