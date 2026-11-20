import { InventorySummaryReadModel } from './inventory-summary.read-model';

export class InventorySummaryPageReadModel {
  public constructor(
    public readonly items: InventorySummaryReadModel[],
    public readonly total: number,
    public readonly page: number,
    public readonly limit: number,
  ) {}
}
