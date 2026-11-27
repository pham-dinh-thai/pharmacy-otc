import { Inject } from '@nestjs/common';
import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  type IUnitOfWork,
  UNIT_OF_WORK,
} from '../../../../../shared/modules/unit-of-work/unit-of-work';
import { Id } from '../../../../../shared/domain/value-objects/id.value-object';
import { RecordAuditLogCommand } from '../../../../audit-logs/application/commands/record-audit-log/record-audit-log.command';
import { recordAuditProps } from '../../../../audit-logs/application/record-audit-log-props';
import { EntityType } from '../../../../audit-logs/domain/enums/entity-type.enum';
import { CreateExpenseCommand } from '../../../../expenses/application/commands/create-expense/create-expense.command';
import { ExpenseCategory } from '../../../../expenses/domain/enums/expense-category.enum';
import { ReceiveStockCommand } from '../../../../inventories/application/commands/receive-stock/receive-stock.command';
import {
  type ISuppliersRepository,
  SUPPLIERS_REPOSITORY,
} from '../../../../suppliers/domain/suppliers.repository';
import { type GoodsReceipt } from '../../../domain/goods-receipt.aggregate';
import { GoodsReceiptNotFoundException } from '../../../domain/exceptions/goods-receipt.exceptions';
import { goodsReceiptSnapshot } from '../../../domain/goods-receipt.snapshot';
import {
  type IGoodsReceiptsRepository,
  GOODS_RECEIPTS_REPOSITORY,
} from '../../../domain/goods-receipts.repository';
import { ConfirmGoodsReceiptCommand } from './confirm-goods-receipt.command';

type StockLine = {
  batchId: string;
  productId: string;
  lotNumber: string;
  quantity: number;
  unitCost: string;
  expiresAt: Date;
};

@CommandHandler(ConfirmGoodsReceiptCommand)
export class ConfirmGoodsReceiptHandler implements ICommandHandler<ConfirmGoodsReceiptCommand> {
  public constructor(
    @Inject(GOODS_RECEIPTS_REPOSITORY)
    private readonly goodsReceiptsRepository: IGoodsReceiptsRepository,

    @Inject(UNIT_OF_WORK)
    private readonly unitOfWork: IUnitOfWork,

    @Inject(SUPPLIERS_REPOSITORY)
    private readonly suppliersRepository: ISuppliersRepository,

    private readonly commandBus: CommandBus,
  ) {}

  public execute(command: ConfirmGoodsReceiptCommand): Promise<{ id: string }> {
    return this.unitOfWork.run(async () => {
      const goodsReceipt = await this.goodsReceiptsRepository.findById(
        command.id,
        { forUpdate: true },
      );

      if (!goodsReceipt) {
        throw new GoodsReceiptNotFoundException(command.id);
      }

      const previousStatus = goodsReceipt.getStatus();
      const confirmedAt = goodsReceipt.confirm(command.confirmedBy);
      const stockLines = this.prepareStockLines(goodsReceipt);

      await this.goodsReceiptsRepository.update(goodsReceipt);

      await this.commandBus.execute(
        new RecordAuditLogCommand(
          recordAuditProps(command.headers, {
            action: 'confirm',
            entityType: EntityType.GOODS_RECEIPTS,
            entityId: goodsReceipt.getId(),
            before: { status: previousStatus },
            after: goodsReceiptSnapshot(goodsReceipt),
          }),
        ),
      );

      for (const line of stockLines) {
        await this.commandBus.execute(
          new ReceiveStockCommand(
            line.lotNumber,
            line.productId,
            line.quantity,
            line.unitCost,
            line.expiresAt,
            command.confirmedBy,
            line.batchId,
          ),
        );
      }

      const supplier = await this.suppliersRepository.findByIdIncludingDeleted(
        goodsReceipt.getSupplierId(),
      );

      await this.commandBus.execute(
        new CreateExpenseCommand(
          `Trả tiền cho nhà cung cấp ${supplier?.getName() ?? 'không xác định'}`,
          ExpenseCategory.OTHER,
          goodsReceipt.getAmount(),
          confirmedAt,
          goodsReceipt.getSupplierId(),
          null,
          `Trả tiền cho phiếu nhập ${goodsReceipt.getCode()}`,
          command.confirmedBy,
          command.headers,
        ),
      );

      return { id: goodsReceipt.getId() };
    });
  }

  /** Batch ids are generated before receiving stock so they stay stable. */
  private prepareStockLines(goodsReceipt: GoodsReceipt): StockLine[] {
    return goodsReceipt.getGoodsReceiptLines().map((line) => {
      const batchId = Id.generate().getValue();

      goodsReceipt.attachBatch(line.getId(), batchId);

      return {
        batchId,
        productId: line.getProductId(),
        lotNumber: line.getLotNumber(),
        quantity: line.getQuantity(),
        unitCost: line.getUnitCost(),
        expiresAt: line.getExpiresAt(),
      };
    });
  }
}
