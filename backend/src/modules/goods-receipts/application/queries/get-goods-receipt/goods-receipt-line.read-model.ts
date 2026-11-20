export class GoodsReceiptLineReadModel {
  public constructor(
    public readonly id: string,
    public readonly productId: string,
    public readonly lotNumber: string,
    public readonly quantity: number,
    public readonly unitCost: string,
    public readonly totalCost: string,
    public readonly expiresAt: Date,
    public readonly batchId: string | null,
  ) {}
}
