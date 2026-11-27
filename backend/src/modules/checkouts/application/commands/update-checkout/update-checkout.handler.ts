import { Inject } from '@nestjs/common';
import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  type IUnitOfWork,
  UNIT_OF_WORK,
} from '../../../../../shared/modules/unit-of-work/unit-of-work';
import { RecordAuditLogCommand } from '../../../../audit-logs/application/commands/record-audit-log/record-audit-log.command';
import { recordAuditProps } from '../../../../audit-logs/application/record-audit-log-props';
import { EntityType } from '../../../../audit-logs/domain/enums/entity-type.enum';
import {
  CHECKOUTS_REPOSITORY,
  type ICheckoutRepository,
} from '../../../domain/checkouts.repository';
import { CheckoutNotFoundException } from '../../../domain/exceptions/checkout.exception';
import { UpdateCheckoutCommand } from './update-checkout.command';

@CommandHandler(UpdateCheckoutCommand)
export class UpdateCheckoutHandler implements ICommandHandler<UpdateCheckoutCommand> {
  public constructor(
    @Inject(UNIT_OF_WORK)
    private readonly unitOfWork: IUnitOfWork,

    @Inject(CHECKOUTS_REPOSITORY)
    private readonly checkoutsRepository: ICheckoutRepository,

    private readonly commandBus: CommandBus,
  ) {}

  public async execute(
    command: UpdateCheckoutCommand,
  ): Promise<{ id: string }> {
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

      checkout.update({
        shippingName: command.shippingName,
        shippingAddress: command.shippingAddress,
        shippingPhone: command.shippingPhone,
        paymentMethod: command.paymentMethod,
      });

      await this.checkoutsRepository.update(checkout);

      await this.commandBus.execute(
        new RecordAuditLogCommand(
          recordAuditProps(command.headers, {
            action: 'update',
            entityType: EntityType.CHECKOUTS,
            entityId: checkout.getId(),
            before,
            after: {
              shippingName: checkout.getShippingName(),
              shippingAddress: checkout.getShippingAddress(),
              shippingPhone: checkout.getShippingPhone(),
              paymentMethod: checkout.getPaymentMethod(),
              status: checkout.getStatus(),
            },
          }),
        ),
      );

      return { id: checkout.getId() };
    });
  }
}
