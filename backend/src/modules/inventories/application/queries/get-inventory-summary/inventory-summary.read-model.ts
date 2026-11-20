export class InventorySummaryReadModel {
  public constructor(
    public readonly productId: string,
    public readonly totalQuantity: number,
    public readonly batchCount: number,
    public readonly nearestExpiry: Date | null,
    public readonly stockValue: string,
    public readonly updatedAt: Date,
  ) {}
}
