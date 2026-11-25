import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { CreateUserByAdminCommand } from './create-user-by-admin.command';
import { CreateUserService } from '../../services/create-user.service';
import {
  type IUnitOfWork,
  UNIT_OF_WORK,
} from '../../../../../shared/modules/unit-of-work/unit-of-work';
import { RecordAuditLogCommand } from '../../../../audit-logs/application/commands/record-audit-log/record-audit-log.command';
import { recordAuditProps } from '../../../../audit-logs/application/record-audit-log-props';
import { EntityType } from '../../../../audit-logs/domain/enums/entity-type.enum';

@CommandHandler(CreateUserByAdminCommand)
export class CreateUserByAdminHandler implements ICommandHandler<CreateUserByAdminCommand> {
  public constructor(
    private readonly createUserService: CreateUserService,

    @Inject(UNIT_OF_WORK)
    private readonly unitOfWork: IUnitOfWork,

    private readonly commandBus: CommandBus,
  ) {}

  public async execute(
    command: CreateUserByAdminCommand,
  ): Promise<{ id: string }> {
    return this.unitOfWork.run(async () => {
      const user = await this.createUserService.create({
        firstName: command.firstName,
        lastName: command.lastName,
        email: command.email,
      });

      await this.commandBus.execute(
        new RecordAuditLogCommand(
          recordAuditProps(command.headers, {
            action: 'create',
            entityType: EntityType.USERS,
            entityId: user.getId(),
            after: {
              firstName: user.getFirstName(),
              lastName: user.getLastName(),
              email: user.getEmail(),
              roleIds: user.getRoleIds(),
            },
          }),
        ),
      );

      return { id: user.getId() };
    });
  }
}
