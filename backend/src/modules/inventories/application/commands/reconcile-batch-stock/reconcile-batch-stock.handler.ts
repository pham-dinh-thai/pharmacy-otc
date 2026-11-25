import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ReconcileBatchStockCommand } from './reconcile-batch-stock.command';
import { Inject } from '@nestjs/common';
import {
  InventoryNotFoundException,
  BatchNotFoundException,
} from '../../../domain/exceptions/inventory.exceptions';
import {
  type IInventoriesRepository,
  INVENTORIES_REPOSITORY,
} from '../../../domain/inventories.repository';
import {
  type IUnitOfWork,
  UNIT_OF_WORK,
} from '../../../../../shared/modules/unit-of-work/unit-of-work';
import { RecordAuditLogCommand } from '../../../../audit-logs/application/commands/record-audit-log/record-audit-log.command';
import { recordAuditProps } from '../../../../audit-logs/application/record-audit-log-props';
import { EntityType } from '../../../../audit-logs/domain/enums/entity-type.enum';

@CommandHandler(ReconcileBatchStockCommand)
export class ReconcileBatchStockHandler implements ICommandHandler<ReconcileBatchStockCommand> {
  public constructor(
    @Inject(INVENTORIES_REPOSITORY)
    private readonly inventoriesRepository: IInventoriesRepository,

    private readonly commandBus: CommandBus,

    @Inject(UNIT_OF_WORK)
    private readonly unitOfWork: IUnitOfWork,
  ) {}

  public async execute(command: ReconcileBatchStockCommand): Promise<number> {
    return this.unitOfWork.run(async () => {
      const inventory = await this.inventoriesRepository.findByProductId(
        command.productId,
        { forUpdate: true },
      );

      if (!inventory) {
        throw new InventoryNotFoundException(command.productId);
      }

      const batch = inventory
        .getBatches()
        .find((item) => item.getId() === command.batchId);

      if (!batch) {
        throw new BatchNotFoundException(command.batchId);
      }

      const beforeQuantity = batch.getQuantity();

      const quantity = inventory.reconcileStock(
        command.batchId,
        command.countedQuantity,
      );

      await this.inventoriesRepository.save(inventory);

      await this.commandBus.execute(
        new RecordAuditLogCommand(
          recordAuditProps(command.headers, {
            action: 'reconcile',
            entityType: EntityType.INVENTORIES,
            entityId: batch.getProductId(),
            before: { quantity: beforeQuantity },
            after: {
              productId: batch.getProductId(),
              batchId: batch.getId(),
              lotNumber: batch.getLotNumber(),
              quantity: batch.getQuantity(),
              unitCost: batch.getUnitCost(),
              status: batch.getStatus(),
              expiresAt: batch.getExpiresAt().toISOString(),
            },
            metadata: { batchId: batch.getId() },
          }),
        ),
      );

      return quantity;
    });
  }
}
