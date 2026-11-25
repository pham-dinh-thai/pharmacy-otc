import { Inject } from '@nestjs/common';
import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  type IUnitOfWork,
  UNIT_OF_WORK,
} from '../../../../../shared/modules/unit-of-work/unit-of-work';
import { recordAuditProps } from '../../../../audit-logs/application/record-audit-log-props';
import { EntityType } from '../../../../audit-logs/domain/enums/entity-type.enum';
import { RecordAuditLogCommand } from '../../../../audit-logs/application/commands/record-audit-log/record-audit-log.command';
import {
  CHECKOUTS_REPOSITORY,
  type ICheckoutRepository,
} from '../../../domain/checkouts.repository';
import type { CheckoutStatus } from '../../../domain/enums/checkout-status.enum';
import { CheckoutNotFoundException } from '../../../domain/exceptions/checkout.exception';
import { ConfirmCheckoutCommand } from './confirm-checkout.command';

@CommandHandler(ConfirmCheckoutCommand)
export class ConfirmCheckoutHandler implements ICommandHandler<ConfirmCheckoutCommand> {
  public constructor(
    @Inject(UNIT_OF_WORK)
    private readonly unitOfWork: IUnitOfWork,

    @Inject(CHECKOUTS_REPOSITORY)
    private readonly checkoutsRepository: ICheckoutRepository,

    private readonly commandBus: CommandBus,
  ) {}

  public async execute(
    command: ConfirmCheckoutCommand,
  ): Promise<{ id: string; status: CheckoutStatus }> {
    return this.unitOfWork.run(async () => {
      const checkout = await this.checkoutsRepository.findById(command.id, {
        forUpdate: true,
      });

      if (!checkout || checkout.getUserId() !== command.headers.actorId) {
        throw new CheckoutNotFoundException(command.id);
      }

      const beforeStatus = checkout.getStatus();

      checkout.confirm();

      await this.checkoutsRepository.update(checkout);

      await this.commandBus.execute(
        new RecordAuditLogCommand(
          recordAuditProps(command.headers, {
            action: 'confirm',
            entityType: EntityType.CHECKOUTS,
            entityId: checkout.getId(),
            before: { status: beforeStatus },
            after: { status: checkout.getStatus() },
          }),
        ),
      );

      return { id: checkout.getId(), status: checkout.getStatus() };
    });
  }
}
