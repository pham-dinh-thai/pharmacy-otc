import { Batch } from '../../domain/batch/batch.entity';
import { BatchListItemReadModel } from './get-batches/batch-list-item.read-model';
import { BatchDetailReadModel } from './get-batch/batch-detail.read-model';

export function batchToListItem(batch: Batch): BatchListItemReadModel {
  return new BatchListItemReadModel(
    batch.getId(),
    batch.getProductId(),
    batch.getLotNumber(),
    batch.getQuantity(),
    batch.getUnitCost(),
    batch.getTotalCost(),
    batch.getStatus(),
    batch.getExpiresAt(),
    batch.getCreatedAt(),
    batch.getUpdatedAt(),
  );
}

export function batchToDetail(batch: Batch): BatchDetailReadModel {
  const item = batchToListItem(batch);

  return new BatchDetailReadModel(
    item.id,
    item.productId,
    item.lotNumber,
    item.quantity,
    item.unitCost,
    item.totalCost,
    item.status,
    item.expiresAt,
    batch.getCreatedBy(),
    item.createdAt,
    item.updatedAt,
  );
}
