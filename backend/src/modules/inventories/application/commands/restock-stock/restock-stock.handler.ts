import { Inject } from '@nestjs/common';
import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  type IUnitOfWork,
  UNIT_OF_WORK,
} from '../../../../../shared/modules/unit-of-work/unit-of-work';
import { RecordAuditLogCommand } from '../../../../audit-logs/application/commands/record-audit-log/record-audit-log.command';
import { recordAuditProps } from '../../../../audit-logs/application/record-audit-log-props';
import { EntityType } from '../../../../audit-logs/domain/enums/entity-type.enum';
import { InventoryNotFoundException } from '../../../domain/exceptions/inventory.exceptions';
import {
  type IInventoriesRepository,
  INVENTORIES_REPOSITORY,
} from '../../../domain/inventories.repository';
import {
  type RestockStockResult,
  RestockStockCommand,
} from './restock-stock.command';

type ReturnedBatch = {
  batchId: string;
  beforeQuantity: number;
  afterQuantity: number;
};

@CommandHandler(RestockStockCommand)
export class RestockStockHandler implements ICommandHandler<
  RestockStockCommand,
  RestockStockResult[]
> {
  public constructor(
    @Inject(INVENTORIES_REPOSITORY)
    private readonly inventoriesRepository: IInventoriesRepository,

    private readonly commandBus: CommandBus,

    @Inject(UNIT_OF_WORK)
    private readonly unitOfWork: IUnitOfWork,
  ) {}

  public execute(command: RestockStockCommand): Promise<RestockStockResult[]> {
    return this.unitOfWork.run(async () => {
      const results: RestockStockResult[] = [];

      for (const item of command.items) {
        const inventory = await this.inventoriesRepository.findByProductId(
          item.productId,
          { forUpdate: true },
        );

        if (!inventory) {
          throw new InventoryNotFoundException(item.productId);
        }

        const returned: ReturnedBatch[] = [];

        for (const batch of item.batches) {
          const beforeQuantity = inventory
            .getBatches()
            .find((entry) => entry.getId() === batch.batchId)
            ?.getQuantity();

          if (beforeQuantity === undefined) {
            continue;
          }

          const afterQuantity = inventory.returnStock(
            batch.batchId,
            batch.quantity,
          );

          returned.push({
            batchId: batch.batchId,
            beforeQuantity,
            afterQuantity,
          });
        }

        if (returned.length === 0) continue;

        await this.inventoriesRepository.save(inventory);

        for (const batch of returned) {
          await this.commandBus.execute(
            new RecordAuditLogCommand(
              recordAuditProps(command.headers, {
                action: 'return',
                entityType: EntityType.INVENTORIES,
                entityId: item.productId,
                before: { quantity: batch.beforeQuantity },
                after: { quantity: batch.afterQuantity },
                metadata: {
                  batchId: batch.batchId,
                  ...(command.orderId ? { orderId: command.orderId } : {}),
                },
              }),
            ),
          );
        }

        results.push({
          productId: item.productId,
          returned: returned.map(
            ({ batchId, beforeQuantity, afterQuantity }) => ({
              batchId,
              quantity: afterQuantity - beforeQuantity,
            }),
          ),
        });
      }

      return results;
    });
  }
}
