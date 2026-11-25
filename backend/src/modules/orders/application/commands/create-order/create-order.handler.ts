import { Inject, Injectable } from '@nestjs/common';
import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  type IUnitOfWork,
  UNIT_OF_WORK,
} from '../../../../../shared/modules/unit-of-work/unit-of-work';
import { RecordAuditLogCommand } from '../../../../audit-logs/application/commands/record-audit-log/record-audit-log.command';
import { recordAuditProps } from '../../../../audit-logs/application/record-audit-log-props';
import { EntityType } from '../../../../audit-logs/domain/enums/entity-type.enum';
import {
  type IssueStockResult,
  IssueStockCommand,
} from '../../../../inventories/application/commands/issue-stock/issue-stock.command';
import { Order } from '../../../domain/order.aggregate';
import { OrderLine } from '../../../domain/order-line.entity';
import {
  type IOrdersRepository,
  ORDERS_REPOSITORY,
} from '../../../domain/orders.repository';
import { orderSnapshot } from '../../../domain/order.snapshot';
import { CreateOrderCommand } from './create-order.command';

@CommandHandler(CreateOrderCommand)
@Injectable()
export class CreateOrderHandler implements ICommandHandler<CreateOrderCommand> {
  public constructor(
    @Inject(UNIT_OF_WORK)
    private readonly unitOfWork: IUnitOfWork,

    @Inject(ORDERS_REPOSITORY)
    private readonly ordersRepository: IOrdersRepository,

    private readonly commandBus: CommandBus,
  ) {}

  public async execute(command: CreateOrderCommand): Promise<{ id: string }> {
    return this.unitOfWork.run(async () => {
      const existing = await this.ordersRepository.findByCheckoutId(
        command.checkoutId,
      );

      if (existing) return { id: existing.getId() };

      const order = Order.create({
        checkoutId: command.checkoutId,
        userId: command.userId,
        lines: command.lines.map((line) => OrderLine.create(line)),
        shippingName: command.shippingName,
        shippingAddress: command.shippingAddress,
        shippingPhone: command.shippingPhone,
        shippingFee: command.shippingFee,
        note: command.note,
      });

      await this.ordersRepository.create(order);

      const stock: IssueStockResult[] = [];

      for (const line of order.getLines()) {
        stock.push(
          await this.commandBus.execute(
            new IssueStockCommand(
              line.getProductId(),
              line.getQuantity(),
              command.headers,
            ),
          ),
        );
      }

      await this.commandBus.execute(
        new RecordAuditLogCommand(
          recordAuditProps(command.headers, {
            action: 'create',
            entityType: EntityType.ORDERS,
            entityId: order.getId(),
            after: orderSnapshot(order),
            metadata: { checkoutId: command.checkoutId, stock },
          }),
        ),
      );

      return { id: order.getId() };
    });
  }
}
