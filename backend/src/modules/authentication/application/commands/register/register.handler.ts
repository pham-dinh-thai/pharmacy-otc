import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { RegisterCommand } from './register.command';
import { Account } from '../../../domain/account.aggregate';
import { Inject } from '@nestjs/common';
import {
  type IUnitOfWork,
  UNIT_OF_WORK,
} from '../../../../../shared/modules/unit-of-work/unit-of-work';
import {
  ACCOUNTS_REPOSITORY,
  type IAccountsRepository,
} from '../../../domain/accounts.repository';
import {
  CREATE_USER_PORT,
  type ICreateUserPort,
} from './ports/create-user.port';
import {
  CREATE_CUSTOMER_PORT,
  type ICreateCustomerPort,
} from './ports/create-customer.port';
import { RecordAuditLogCommand } from '../../../../audit-logs/application/commands/record-audit-log/record-audit-log.command';
import { recordAuditProps } from '../../../../audit-logs/application/record-audit-log-props';
import { EntityType } from '../../../../audit-logs/domain/enums/entity-type.enum';
import { ActorType } from '../../../../audit-logs/domain/enums/actor-type.enum';

@CommandHandler(RegisterCommand)
export class RegisterHandler implements ICommandHandler<RegisterCommand> {
  public constructor(
    @Inject(ACCOUNTS_REPOSITORY)
    private readonly accountsRepository: IAccountsRepository,

    @Inject(CREATE_USER_PORT)
    private readonly createUserPort: ICreateUserPort,

    @Inject(CREATE_CUSTOMER_PORT)
    private readonly createCustomerPort: ICreateCustomerPort,

    @Inject(UNIT_OF_WORK)
    private readonly unitOfWork: IUnitOfWork,

    private readonly commandBus: CommandBus,
  ) {}

  public async execute(command: RegisterCommand): Promise<void> {
    return this.unitOfWork.run(async () => {
      const user = await this.createUserPort.execute({
        firstName: command.firstName,
        lastName: command.lastName,
        email: command.email,
      });

      const customer = await this.createCustomerPort.execute({
        userId: user.id,
        ...command.profile,
      });

      const account = await Account.create({
        userId: user.id,
        password: command.password,
      });

      this.accountsRepository.create(account);

      await this.commandBus.execute(
        new RecordAuditLogCommand(
          recordAuditProps(
            {
              actorId: user.id,
              actorType: ActorType.USER,
              actorLabel: command.email,
              userIp: command.ip,
              userAgent: command.userAgent,
            },
            {
              action: 'sign_up',
              entityType: EntityType.ACCOUNTS,
              entityId: account.getId(),
              after: {
                accountId: account.getId(),
                userId: account.getUserId(),
              },
            },
          ),
        ),
      );

      await this.commandBus.execute(
        new RecordAuditLogCommand(
          recordAuditProps(
            {
              actorId: user.id,
              actorType: ActorType.USER,
              actorLabel: command.email,
              userIp: command.ip,
              userAgent: command.userAgent,
            },
            {
              action: 'create',
              entityType: EntityType.CUSTOMERS,
              entityId: customer.id,
              after: {
                userId: user.id,
              },
            },
          ),
        ),
      );
    });
  }
}
