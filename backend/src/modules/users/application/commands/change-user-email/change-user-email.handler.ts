import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ChangeUserEmailCommand } from './change-user-email.command';
import { ChangeUserEmailReadModel } from './change-user-email.read-model';
import { Inject } from '@nestjs/common';
import { UserNotFoundException } from '../../../domain/exceptions/user.exceptions';
import {
  type IUsersRepository,
  USERS_REPOSITORY,
} from '../../../domain/users.repository';
import {
  type IUnitOfWork,
  UNIT_OF_WORK,
} from '../../../../../shared/modules/unit-of-work/unit-of-work';
import { RecordAuditLogCommand } from '../../../../audit-logs/application/commands/record-audit-log/record-audit-log.command';
import { recordAuditProps } from '../../../../audit-logs/application/record-audit-log-props';
import { EntityType } from '../../../../audit-logs/domain/enums/entity-type.enum';

@CommandHandler(ChangeUserEmailCommand)
export class ChangeUserEmailHandler implements ICommandHandler<ChangeUserEmailCommand> {
  public constructor(
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: IUsersRepository,

    @Inject(UNIT_OF_WORK)
    private readonly unitOfWork: IUnitOfWork,

    private readonly commandBus: CommandBus,
  ) {}

  public async execute(
    command: ChangeUserEmailCommand,
  ): Promise<ChangeUserEmailReadModel> {
    return this.unitOfWork.run(async () => {
      const user = await this.usersRepository.findById(command.id);

      if (!user) {
        throw new UserNotFoundException(command.id);
      }

      const previousEmail = user.getEmail();

      user.changeEmail(command.email);

      await this.usersRepository.update(user);

      await this.commandBus.execute(
        new RecordAuditLogCommand(
          recordAuditProps(command.headers, {
            action: 'change_email',
            entityType: EntityType.USERS,
            entityId: user.getId(),
            before: { email: previousEmail },
            after: { email: user.getEmail() },
          }),
        ),
      );

      return new ChangeUserEmailReadModel(
        user.getId(),
        user.getFirstName(),
        user.getLastName(),
        user.getEmail(),
        user.getRoleIds(),
      );
    });
  }
}
