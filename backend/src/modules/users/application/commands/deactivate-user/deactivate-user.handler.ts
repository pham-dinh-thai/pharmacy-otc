import { Inject } from '@nestjs/common';
import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  ACCOUNTS_REPOSITORY,
  type IAccountsRepository,
} from '../../../../authentication/domain/accounts.repository';
import {
  type IUnitOfWork,
  UNIT_OF_WORK,
} from '../../../../../shared/modules/unit-of-work/unit-of-work';
import { RecordAuditLogCommand } from '../../../../audit-logs/application/commands/record-audit-log/record-audit-log.command';
import { recordAuditProps } from '../../../../audit-logs/application/record-audit-log-props';
import { EntityType } from '../../../../audit-logs/domain/enums/entity-type.enum';
import { DeactivateUserCommand } from './deactivate-user.command';

@CommandHandler(DeactivateUserCommand)
export class DeactivateUserHandler implements ICommandHandler<DeactivateUserCommand> {
  public constructor(
    @Inject(ACCOUNTS_REPOSITORY)
    private readonly accountsRepository: IAccountsRepository,

    @Inject(UNIT_OF_WORK)
    private readonly unitOfWork: IUnitOfWork,

    private readonly commandBus: CommandBus,
  ) {}

  public execute(command: DeactivateUserCommand): Promise<{ userId: string }> {
    return this.unitOfWork.run(async () => {
      const account = await this.accountsRepository.findByUserId(
        command.userId,
      );

      // Employees without a login account have nothing to deactivate. An
      // already inactive account also skips the audit event, so retries of the
      // same deactivation stay idempotent.
      if (!account || !account.getIsActive()) {
        return { userId: command.userId };
      }

      account.deactivate();

      await this.accountsRepository.update(account);

      await this.commandBus.execute(
        new RecordAuditLogCommand(
          recordAuditProps(command.headers, {
            action: 'deactivate',
            entityType: EntityType.ACCOUNTS,
            entityId: account.getId(),
            before: { isActive: true },
            after: { isActive: false },
            metadata: { userId: command.userId },
          }),
        ),
      );

      return { userId: command.userId };
    });
  }
}
