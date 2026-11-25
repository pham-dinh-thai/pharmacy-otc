import { Inject } from '@nestjs/common';
import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  type IUnitOfWork,
  UNIT_OF_WORK,
} from '../../../../../shared/modules/unit-of-work/unit-of-work';
import { RecordAuditLogCommand } from '../../../../audit-logs/application/commands/record-audit-log/record-audit-log.command';
import { recordAuditProps } from '../../../../audit-logs/application/record-audit-log-props';
import { EntityType } from '../../../../audit-logs/domain/enums/entity-type.enum';
import { BatchStatus } from '../../../domain/batch/batch-status.enum';
import { StockQuantity } from '../../../domain/batch/value-objects/stock-quantity.value-object';
import {
  InsufficientStockException,
  InventoryNotFoundException,
} from '../../../domain/exceptions/inventory.exceptions';
import {
  type IInventoriesRepository,
  INVENTORIES_REPOSITORY,
} from '../../../domain/inventories.repository';
import {
  type IssueStockResult,
  IssueStockCommand,
} from './issue-stock.command';

type IssuedBatchEvent = {
  batchId: string;
  productId: string;
  lotNumber: string;
  beforeQuantity: number;
  afterQuantity: number;
  unitCost: string;
  status: BatchStatus;
  expiresAt: Date;
};

@CommandHandler(IssueStockCommand)
export class IssueStockHandler implements ICommandHandler<IssueStockCommand> {
  public constructor(
    @Inject(INVENTORIES_REPOSITORY)
    private readonly inventoriesRepository: IInventoriesRepository,

    private readonly commandBus: CommandBus,

    @Inject(UNIT_OF_WORK)
    private readonly unitOfWork: IUnitOfWork,
  ) {}

  public async execute(command: IssueStockCommand): Promise<IssueStockResult> {
    StockQuantity.assertPositive(command.quantity, 'Issue quantity');

    return this.unitOfWork.run(async () => {
      const inventory = await this.inventoriesRepository.findByProductId(
        command.productId,
        { forUpdate: true },
      );

      if (!inventory) {
        throw new InventoryNotFoundException(command.productId);
      }

      const now = new Date();
      const usableBatches = inventory
        .getBatches()
        .filter(
          (batch) =>
            batch.getStatus() === BatchStatus.ACTIVE &&
            batch.getExpiresAt().getTime() > now.getTime() &&
            batch.getQuantity() > 0,
        )
        .sort(
          (left, right) =>
            left.getExpiresAt().getTime() - right.getExpiresAt().getTime() ||
            left.getCreatedAt().getTime() - right.getCreatedAt().getTime() ||
            left.getId().localeCompare(right.getId()),
        );

      const available = usableBatches.reduce(
        (sum, batch) => sum + batch.getQuantity(),
        0,
      );

      if (available < command.quantity) {
        throw new InsufficientStockException(available, command.quantity);
      }

      const issuedEvents: IssuedBatchEvent[] = [];
      let remaining = command.quantity;

      for (const batch of usableBatches) {
        if (remaining === 0) break;

        const quantity = Math.min(batch.getQuantity(), remaining);
        const beforeQuantity = batch.getQuantity();

        inventory.issueStock(batch.getId(), quantity);
        remaining -= quantity;

        issuedEvents.push({
          batchId: batch.getId(),
          productId: batch.getProductId(),
          lotNumber: batch.getLotNumber(),
          beforeQuantity,
          afterQuantity: batch.getQuantity(),
          unitCost: batch.getUnitCost(),
          status: batch.getStatus(),
          expiresAt: batch.getExpiresAt(),
        });
      }

      await this.inventoriesRepository.save(inventory);

      for (const event of issuedEvents) {
        await this.commandBus.execute(
          new RecordAuditLogCommand(
            recordAuditProps(command.headers, {
              action: 'issue',
              entityType: EntityType.INVENTORIES,
              entityId: event.productId,
              before: { quantity: event.beforeQuantity },
              after: {
                productId: event.productId,
                batchId: event.batchId,
                lotNumber: event.lotNumber,
                quantity: event.afterQuantity,
                unitCost: event.unitCost,
                status: event.status,
                expiresAt: event.expiresAt.toISOString(),
              },
              metadata: { batchId: event.batchId },
            }),
          ),
        );
      }

      return {
        productId: command.productId,
        issued: issuedEvents.map(
          ({ batchId, afterQuantity, beforeQuantity }) => ({
            batchId,
            quantity: beforeQuantity - afterQuantity,
          }),
        ),
      };
    });
  }
}
