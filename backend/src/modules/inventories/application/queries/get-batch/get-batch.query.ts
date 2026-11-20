import { Query } from '@nestjs/cqrs';
import { BatchDetailReadModel } from './batch-detail.read-model';

export class GetBatchQuery extends Query<BatchDetailReadModel> {
  public constructor(public readonly id: string) {
    super();
  }
}
