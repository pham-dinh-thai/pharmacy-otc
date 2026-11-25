import { Command } from '@nestjs/cqrs';
import type { ActorHeaders } from '../../../../../shared/types/actor-headers';

export type IssuedStockBatch = {
  batchId: string;
  quantity: number;
};

export type IssueStockResult = {
  productId: string;
  issued: IssuedStockBatch[];
};

export class IssueStockCommand extends Command<IssueStockResult> {
  public constructor(
    public readonly productId: string,
    public readonly quantity: number,
    public readonly headers: ActorHeaders,
  ) {
    super();
  }
}
