import { GoodsReceipt } from '../../domain/goods-receipt.aggregate';
import { GoodsReceiptLine } from '../../domain/goods-receipt-line.entity';
import { GoodsReceiptLineReadModel } from './get-goods-receipt/goods-receipt-line.read-model';
import { GoodsReceiptListItemReadModel } from './get-goods-receipts/goods-receipt-list-item.read-model';
import { GoodsReceiptDetailReadModel } from './get-goods-receipt/goods-receipt-detail.read-model';

export function goodsReceiptLineToReadModel(
  line: GoodsReceiptLine,
): GoodsReceiptLineReadModel {
  return new GoodsReceiptLineReadModel(
    line.getId(),
    line.getProductId(),
    line.getLotNumber(),
    line.getQuantity(),
    line.getUnitCost(),
    line.getTotalCost().toString(),
    line.getExpiresAt(),
    line.getBatchId(),
  );
}

export function goodsReceiptToListItem(
  receipt: GoodsReceipt,
): GoodsReceiptListItemReadModel {
  const lines = receipt.getGoodsReceiptLines();

  return new GoodsReceiptListItemReadModel(
    receipt.getId(),
    receipt.getCode(),
    receipt.getSupplierId(),
    receipt.getStatus(),
    lines.length,
    lines.reduce((sum, line) => sum + line.getQuantity(), 0),
    receipt.getAmount().toString(),
    receipt.getCreatedBy(),
    receipt.getConfirmedBy(),
    receipt.getConfirmedAt(),
    receipt.getCancelledBy(),
    receipt.getCancelledAt(),
    receipt.getCreatedAt(),
    receipt.getUpdatedAt(),
  );
}

export function goodsReceiptToDetail(
  receipt: GoodsReceipt,
): GoodsReceiptDetailReadModel {
  const item = goodsReceiptToListItem(receipt);

  return new GoodsReceiptDetailReadModel(
    item.id,
    item.code,
    item.supplierId,
    item.status,
    item.lineCount,
    item.totalQuantity,
    item.totalCost,
    item.createdBy,
    item.confirmedBy,
    item.confirmedAt,
    item.cancelledBy,
    item.cancelledAt,
    item.createdAt,
    item.updatedAt,
    receipt
      .getGoodsReceiptLines()
      .map((line) => goodsReceiptLineToReadModel(line)),
  );
}
