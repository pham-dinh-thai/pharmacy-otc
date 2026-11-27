import { Inject } from '@nestjs/common';
import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  type IUnitOfWork,
  UNIT_OF_WORK,
} from '../../../../../shared/modules/unit-of-work/unit-of-work';
import { RecordAuditLogCommand } from '../../../../audit-logs/application/commands/record-audit-log/record-audit-log.command';
import { recordAuditProps } from '../../../../audit-logs/application/record-audit-log-props';
import { EntityType } from '../../../../audit-logs/domain/enums/entity-type.enum';
import { Payment } from '../../../domain/payment.aggregate';
import {
  type IPaymentsRepository,
  PAYMENTS_REPOSITORY,
} from '../../../domain/payments.repository';
import { CreatePaymentCommand } from './create-payment.command';

@CommandHandler(CreatePaymentCommand)
export class CreatePaymentHandler implements ICommandHandler<
  CreatePaymentCommand,
  { id: string }
> {
  public constructor(
    @Inject(UNIT_OF_WORK)
    private readonly unitOfWork: IUnitOfWork,

    @Inject(PAYMENTS_REPOSITORY)
    private readonly paymentsRepository: IPaymentsRepository,

    private readonly commandBus: CommandBus,
  ) {}

  public async execute(command: CreatePaymentCommand): Promise<{ id: string }> {
    return this.unitOfWork.run(async () => {
      const payment = Payment.create({
        orderId: command.orderId,
        provider: command.provider,
        amount: command.amount,
        transactionRef: command.transactionRef,
        gateway: command.gateway,
      });

      await this.paymentsRepository.create(payment);

      await this.commandBus.execute(
        new RecordAuditLogCommand(
          recordAuditProps(command.headers, {
            action: 'payment_created',
            entityType: EntityType.ORDERS,
            entityId: command.orderId,
            after: {
              paymentId: payment.getId(),
              provider: payment.getProvider(),
              amount: payment.getAmount().toString(),
              transactionRef: payment.getTransactionRef(),
              status: payment.getStatus(),
            },
          }),
        ),
      );

      return { id: payment.getId() };
    });
  }
}
