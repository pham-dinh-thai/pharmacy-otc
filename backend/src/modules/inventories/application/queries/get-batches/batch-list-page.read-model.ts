import { BatchListItemReadModel } from './batch-list-item.read-model';

export class BatchListPageReadModel {
  public constructor(
    public readonly items: BatchListItemReadModel[],
    public readonly total: number,
    public readonly page: number,
    public readonly limit: number,
  ) {}
}
