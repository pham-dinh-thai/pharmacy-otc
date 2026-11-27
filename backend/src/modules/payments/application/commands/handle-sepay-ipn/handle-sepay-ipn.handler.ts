import { Inject } from '@nestjs/common';
import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  type IUnitOfWork,
  UNIT_OF_WORK,
} from '../../../../../shared/modules/unit-of-work/unit-of-work';
import { systemActorHeaders } from '../../../../../shared/types/actor-headers';
import { RecordAuditLogCommand } from '../../../../audit-logs/application/commands/record-audit-log/record-audit-log.command';
import { recordAuditProps } from '../../../../audit-logs/application/record-audit-log-props';
import { EntityType } from '../../../../audit-logs/domain/enums/entity-type.enum';
import { OrderPaymentStatus } from '../../../../orders/domain/enums/order-payment-status.enum';
import { OrderNotFoundException } from '../../../../orders/domain/exceptions/order.exception';
import {
  ORDERS_REPOSITORY,
  type IOrdersRepository,
} from '../../../../orders/domain/orders.repository';
import { PaymentProvider } from '../../../domain/enums/payment-provider.enum';
import {
  PaymentAmountMismatchException,
  PaymentInvalidNotificationException,
  PaymentNotFoundException,
} from '../../../domain/exceptions/payment.exception';
import {
  PAYMENTS_REPOSITORY,
  type IPaymentsRepository,
} from '../../../domain/payments.repository';
import { HandleSepayIpnCommand } from './handle-sepay-ipn.command';

@CommandHandler(HandleSepayIpnCommand)
export class HandleSepayIpnHandler implements ICommandHandler<HandleSepayIpnCommand> {
  public constructor(
    @Inject(UNIT_OF_WORK)
    private readonly unitOfWork: IUnitOfWork,

    @Inject(PAYMENTS_REPOSITORY)
    private readonly paymentsRepository: IPaymentsRepository,

    @Inject(ORDERS_REPOSITORY)
    private readonly ordersRepository: IOrdersRepository,

    private readonly commandBus: CommandBus,
  ) {}

  public async execute(command: HandleSepayIpnCommand): Promise<void> {
    return this.unitOfWork.run(async () => {
      if (command.payload.notificationType !== 'ORDER_PAID') {
        return;
      }

      if (command.payload.transaction.status !== 'APPROVED') {
        throw new PaymentInvalidNotificationException();
      }

      const payment = await this.paymentsRepository.findByTransactionRef(
        command.payload.order.invoiceNumber,
        { forUpdate: true },
      );

      if (!payment) {
        throw new PaymentNotFoundException(command.payload.order.invoiceNumber);
      }

      if (payment.getProvider() !== PaymentProvider.SEPAY) {
        throw new PaymentInvalidNotificationException();
      }

      if (
        payment.getAmount() !== command.payload.order.amount ||
        payment.getAmount() !== command.payload.transaction.amount
      ) {
        throw new PaymentAmountMismatchException();
      }

      payment.markSucceeded({
        providerTransactionNo:
          command.payload.transaction.transactionId ??
          command.payload.transaction.id ??
          null,
        bankCode: command.payload.transaction.bankCode ?? null,
        responseCode: command.payload.transaction.responseCode ?? null,
        payload: command.payload.raw,
      });

      await this.paymentsRepository.update(payment);

      const order = await this.ordersRepository.findById(payment.getOrderId(), {
        forUpdate: true,
      });

      if (!order) {
        throw new OrderNotFoundException(payment.getOrderId());
      }

      if (order.getPaymentStatus() === OrderPaymentStatus.PAID) {
        return;
      }

      const before = {
        orderStatus: order.getStatus(),
        paymentStatus: order.getPaymentStatus(),
      };

      order.markPaid();

      await this.ordersRepository.update(order);

      await this.commandBus.execute(
        new RecordAuditLogCommand(
          recordAuditProps(systemActorHeaders(), {
            action: 'payment_ipn',
            entityType: EntityType.ORDERS,
            entityId: order.getId(),
            before,
            after: {
              orderStatus: order.getStatus(),
              paymentStatus: order.getPaymentStatus(),
              paidAt: order.getPaidAt()?.toISOString() ?? null,
              providerPaymentStatus: payment.getStatus(),
              providerTransactionNo:
                command.payload.transaction.transactionId ??
                command.payload.transaction.id ??
                null,
            },
          }),
        ),
      );
    });
  }
}
