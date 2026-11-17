import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  ACCOUNTS_REPOSITORY,
  type IAccountsRepository,
} from '../../../../authentication/domain/accounts.repository';
import {
  type IOutboxRepository,
  OUTBOX_REPOSITORY,
} from '../../../../../shared/modules/outbox/domain/outbox.repository';
import {
  type IUnitOfWork,
  UNIT_OF_WORK,
} from '../../../../../shared/modules/unit-of-work/unit-of-work';
import { auditEventPayload } from '../../../../audit-logs/domain/events/audit-event.payload';
import { EntityType } from '../../../../audit-logs/domain/enums/entity-type.enum';
import { USER_DEACTIVATED_EVENT } from '../../../domain/events/user-deactivated.event';
import { DeactivateUserCommand } from './deactivate-user.command';

@CommandHandler(DeactivateUserCommand)
export class DeactivateUserHandler implements ICommandHandler<DeactivateUserCommand> {
  public constructor(
    @Inject(ACCOUNTS_REPOSITORY)
    private readonly accountsRepository: IAccountsRepository,

    @Inject(OUTBOX_REPOSITORY)
    private readonly outboxRepository: IOutboxRepository,

    @Inject(UNIT_OF_WORK)
    private readonly unitOfWork: IUnitOfWork,
  ) {}

  public execute(command: DeactivateUserCommand): Promise<{ userId: string }> {
    return this.unitOfWork.run(async () => {
      const account = await this.accountsRepository.findByUserId(
        command.userId,
      );

      // Employees without a login account have nothing to deactivate. An
      // already inactive account also skips the audit event, so retries of the
      // same outbox event stay idempotent.
      if (!account || !account.getIsActive()) {
        return { userId: command.userId };
      }

      account.deactivate();

      await this.accountsRepository.update(account);

      await this.outboxRepository.create({
        eventType: USER_DEACTIVATED_EVENT,
        payload: auditEventPayload(command.headers, {
          entityType: EntityType.ACCOUNTS,
          entityId: account.getId(),
          before: { isActive: true },
          after: { isActive: false },
          metadata: { userId: command.userId },
        }),
      });

      return { userId: command.userId };
    });
  }
}
