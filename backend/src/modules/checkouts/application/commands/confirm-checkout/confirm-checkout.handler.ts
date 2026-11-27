import { Inject } from '@nestjs/common';
import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  type IUnitOfWork,
  UNIT_OF_WORK,
} from '../../../../../shared/modules/unit-of-work/unit-of-work';
import { RecordAuditLogCommand } from '../../../../audit-logs/application/commands/record-audit-log/record-audit-log.command';
import { recordAuditProps } from '../../../../audit-logs/application/record-audit-log-props';
import { EntityType } from '../../../../audit-logs/domain/enums/entity-type.enum';
import { DeductCartItemsCommand } from '../../../../carts/application/commands/deduct-cart-items/deduct-cart-items.command';
import { CreateOrderCommand } from '../../../../orders/application/commands/create-order/create-order.command';
import {
  CHECKOUTS_REPOSITORY,
  type ICheckoutRepository,
} from '../../../domain/checkouts.repository';
import { CheckoutNotFoundException } from '../../../domain/exceptions/checkout.exception';
import { isOnlinePaymentMethod } from '../../../../../shared/domain/enums/payment-method.enum';
import { ConfirmCheckoutCommand } from './confirm-checkout.command';
import type { ConfirmCheckoutResult } from './confirm-checkout.command';
import { OnlinePaymentRequestStrategyResolver } from './strategies/online-payment-request.strategy-resolver';

@CommandHandler(ConfirmCheckoutCommand)
export class ConfirmCheckoutHandler implements ICommandHandler<ConfirmCheckoutCommand> {
  public constructor(
    @Inject(UNIT_OF_WORK)
    private readonly unitOfWork: IUnitOfWork,

    @Inject(CHECKOUTS_REPOSITORY)
    private readonly checkoutsRepository: ICheckoutRepository,

    private readonly commandBus: CommandBus,

    private readonly paymentRequestStrategies: OnlinePaymentRequestStrategyResolver,
  ) {}

  public async execute(
    command: ConfirmCheckoutCommand,
  ): Promise<ConfirmCheckoutResult> {
    return this.unitOfWork.run(async () => {
      const checkout = await this.checkoutsRepository.findById(command.id, {
        forUpdate: true,
      });

      if (!checkout || checkout.getUserId() !== command.headers.actorId) {
        throw new CheckoutNotFoundException(command.id);
      }

      const before = {
        shippingName: checkout.getShippingName(),
        shippingAddress: checkout.getShippingAddress(),
        shippingPhone: checkout.getShippingPhone(),
        paymentMethod: checkout.getPaymentMethod(),
        status: checkout.getStatus(),
      };
      const lines = checkout.getLines().map((line) => ({
        productId: line.getProductId(),
        quantity: line.getQuantity(),
        productName: line.getProductName(),
        productSku: line.getProductSku(),
        unitPrice: line.getUnitPrice(),
      }));

      checkout.confirm();

      await this.checkoutsRepository.update(checkout);

      const { id: orderId } = await this.commandBus.execute(
        new CreateOrderCommand(
          checkout.getId(),
          checkout.getUserId(),
          lines.map((line) => ({
            productId: line.productId,
            productName: line.productName,
            productSku: line.productSku,
            unitPrice: line.unitPrice,
            quantity: line.quantity,
          })),
          checkout.getShippingName(),
          checkout.getShippingAddress(),
          checkout.getShippingPhone(),
          0n,
          null,
          command.headers,
        ),
      );

      const paymentMethod = checkout.getPaymentMethod();
      const payment = isOnlinePaymentMethod(paymentMethod)
        ? await this.paymentRequestStrategies
            .resolve(paymentMethod)
            .buildRequest({
              orderId,
              amount: checkout.getAmount(),
              headers: command.headers,
            })
        : null;

      await this.commandBus.execute(
        new DeductCartItemsCommand(
          { userId: checkout.getUserId() },
          lines.map((line) => ({
            productId: line.productId,
            quantity: line.quantity,
          })),
        ),
      );

      await this.commandBus.execute(
        new RecordAuditLogCommand(
          recordAuditProps(command.headers, {
            action: 'confirm',
            entityType: EntityType.CHECKOUTS,
            entityId: checkout.getId(),
            before,
            after: {
              shippingName: checkout.getShippingName(),
              shippingAddress: checkout.getShippingAddress(),
              shippingPhone: checkout.getShippingPhone(),
              paymentMethod: checkout.getPaymentMethod(),
              status: checkout.getStatus(),
              orderId,
              paymentMode: payment ? 'online' : 'offline',
              provider: payment?.provider ?? null,
            },
          }),
        ),
      );

      return {
        id: checkout.getId(),
        status: checkout.getStatus(),
        orderId,
        paymentMode: payment ? 'online' : 'offline',
        provider: payment?.provider ?? null,
      };
    });
  }
}
