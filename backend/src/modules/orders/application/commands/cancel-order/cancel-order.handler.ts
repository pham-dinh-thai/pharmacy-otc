import { Inject } from '@nestjs/common';
import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  type IUnitOfWork,
  UNIT_OF_WORK,
} from '../../../../../shared/modules/unit-of-work/unit-of-work';
import { RecordAuditLogCommand } from '../../../../audit-logs/application/commands/record-audit-log/record-audit-log.command';
import { recordAuditProps } from '../../../../audit-logs/application/record-audit-log-props';
import type { AuditLog } from '../../../../audit-logs/domain/audit-log.aggregate';
import {
  AUDIT_LOGS_REPOSITORY,
  type IAuditLogsRepository,
} from '../../../../audit-logs/domain/audit-logs.repository';
import { EntityType } from '../../../../audit-logs/domain/enums/entity-type.enum';
import type {
  RestockBatch,
  RestockStockItem,
} from '../../../../inventories/application/commands/restock-stock/restock-stock.command';
import { RestockStockCommand } from '../../../../inventories/application/commands/restock-stock/restock-stock.command';
import { OrderNotFoundException } from '../../../domain/exceptions/order.exception';
import type { OrderStatus } from '../../../domain/enums/order-status.enum';
import {
  ORDERS_REPOSITORY,
  type IOrdersRepository,
} from '../../../domain/orders.repository';
import { CancelOrderCommand } from './cancel-order.command';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const restockItemsFromAudit = (logs: AuditLog[]): RestockStockItem[] => {
  const created = logs.find((log) => log.getAction() === 'create');
  const stock = created?.getMetadata().stock;

  if (!Array.isArray(stock)) return [];

  return stock.flatMap((entry: unknown): RestockStockItem[] => {
    if (
      !isRecord(entry) ||
      typeof entry.productId !== 'string' ||
      !Array.isArray(entry.issued)
    ) {
      return [];
    }

    const batches = entry.issued.flatMap((item: unknown): RestockBatch[] => {
      if (
        !isRecord(item) ||
        typeof item.batchId !== 'string' ||
        typeof item.quantity !== 'number' ||
        !Number.isInteger(item.quantity) ||
        item.quantity <= 0
      ) {
        return [];
      }

      return [{ batchId: item.batchId, quantity: item.quantity }];
    });

    return batches.length > 0 ? [{ productId: entry.productId, batches }] : [];
  });
};

@CommandHandler(CancelOrderCommand)
export class CancelOrderHandler implements ICommandHandler<
  CancelOrderCommand,
  { id: string; status: OrderStatus }
> {
  public constructor(
    @Inject(UNIT_OF_WORK)
    private readonly unitOfWork: IUnitOfWork,

    @Inject(ORDERS_REPOSITORY)
    private readonly ordersRepository: IOrdersRepository,

    @Inject(AUDIT_LOGS_REPOSITORY)
    private readonly auditLogsRepository: IAuditLogsRepository,

    private readonly commandBus: CommandBus,
  ) {}

  public async execute(
    command: CancelOrderCommand,
  ): Promise<{ id: string; status: OrderStatus }> {
    return this.unitOfWork.run(async () => {
      const order = await this.ordersRepository.findById(command.orderId, {
        forUpdate: true,
      });

      if (!order || order.getUserId() !== command.userId) {
        throw new OrderNotFoundException(command.orderId);
      }

      const beforeStatus = order.getStatus();
      order.cancel();

      const logs = await this.auditLogsRepository.findByEntity(
        EntityType.ORDERS,
        command.orderId,
      );

      await this.commandBus.execute(
        new RestockStockCommand(
          restockItemsFromAudit(logs),
          command.headers,
          command.orderId,
        ),
      );

      await this.ordersRepository.update(order);

      await this.commandBus.execute(
        new RecordAuditLogCommand(
          recordAuditProps(command.headers, {
            action: 'cancel',
            entityType: EntityType.ORDERS,
            entityId: command.orderId,
            before: { status: beforeStatus },
            after: {
              status: order.getStatus(),
              cancelledAt: order.getCancelledAt()?.toISOString() ?? null,
            },
          }),
        ),
      );

      return { id: command.orderId, status: order.getStatus() };
    });
  }
}
