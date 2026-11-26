import { Command } from '@nestjs/cqrs';
import type { ActorHeaders } from '../../../../../shared/types/actor-headers';

export type RestockBatch = {
  batchId: string;
  quantity: number;
};

export type RestockStockItem = {
  productId: string;
  batches: RestockBatch[];
};

export type RestockStockResult = {
  productId: string;
  returned: RestockBatch[];
};

export class RestockStockCommand extends Command<RestockStockResult[]> {
  public constructor(
    public readonly items: RestockStockItem[],
    public readonly headers: ActorHeaders,
    public readonly orderId?: string,
  ) {
    super();
  }
}
