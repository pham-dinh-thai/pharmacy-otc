import { Inject } from '@nestjs/common';
import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  type IUnitOfWork,
  UNIT_OF_WORK,
} from '../../../../../shared/modules/unit-of-work/unit-of-work';
import { AddCartItemsCommand } from '../../../../carts/application/commands/add-cart-items/add-cart-items.command';
import { OrderNotFoundException } from '../../../domain/exceptions/order.exception';
import {
  ORDERS_REPOSITORY,
  type IOrdersRepository,
} from '../../../domain/orders.repository';
import { ReorderOrderCommand } from './reorder-order.command';

@CommandHandler(ReorderOrderCommand)
export class ReorderOrderHandler implements ICommandHandler<
  ReorderOrderCommand,
  { id: string; totalItems: number }
> {
  public constructor(
    @Inject(UNIT_OF_WORK)
    private readonly unitOfWork: IUnitOfWork,

    @Inject(ORDERS_REPOSITORY)
    private readonly ordersRepository: IOrdersRepository,

    private readonly commandBus: CommandBus,
  ) {}

  public async execute(
    command: ReorderOrderCommand,
  ): Promise<{ id: string; totalItems: number }> {
    return this.unitOfWork.run(async () => {
      const order = await this.ordersRepository.findById(command.orderId);

      if (!order || order.getUserId() !== command.userId) {
        throw new OrderNotFoundException(command.orderId);
      }

      return this.commandBus.execute(
        new AddCartItemsCommand(
          { userId: command.userId },
          order.getLines().map((line) => ({
            productId: line.getProductId(),
            quantity: line.getQuantity(),
          })),
        ),
      );
    });
  }
}
