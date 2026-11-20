import { Batch } from './batch/batch.entity';
import { BatchStatus } from './batch/batch-status.enum';
import { Inventory } from './inventory.aggregate';

export type FindInventoryOptions = {
  forUpdate?: boolean;
};

export type FindBatchesFilters = {
  productId?: string | null;
  lotNumber?: string | null;
  status?: BatchStatus | 'all';
  expiresBefore?: Date | null;
  limit?: number;
  offset?: number;
};

export type BatchPage = {
  items: Batch[];
  total: number;
};

export type FindInventorySummaryFilters = {
  productId?: string | null;
  limit?: number;
  offset?: number;
};

export type InventorySummary = {
  productId: string;
  totalQuantity: number;
  batchCount: number;
  nearestExpiry: Date | null;
  stockValue: string;
  updatedAt: Date;
};

export type InventorySummaryPage = {
  items: InventorySummary[];
  total: number;
};

export interface IInventoriesRepository {
  findByProductId(
    productId: string,
    options?: FindInventoryOptions,
  ): Promise<Inventory | null>;

  findBatchesPage(filters?: FindBatchesFilters): Promise<BatchPage>;

  findBatchById(id: string): Promise<Batch | null>;

  findInventorySummaryPage(
    filters?: FindInventorySummaryFilters,
  ): Promise<InventorySummaryPage>;

  save(inventory: Inventory): Promise<Inventory>;
}

export const INVENTORIES_REPOSITORY = 'IInventoriesRepository';
