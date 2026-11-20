import type { BatchStatus } from '../../../domain/batch/batch-status.enum';

export class BatchListItemReadModel {
  public constructor(
    public readonly id: string,
    public readonly productId: string,
    public readonly lotNumber: string,
    public readonly quantity: number,
    public readonly unitCost: string,
    public readonly totalCost: string,
    public readonly status: BatchStatus,
    public readonly expiresAt: Date,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
}
