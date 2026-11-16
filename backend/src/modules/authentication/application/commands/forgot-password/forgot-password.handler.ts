import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ForgotPasswordCommand } from './forgot-password.command';
import { BadRequestException, ConflictException, Inject } from '@nestjs/common';
import {
  GET_USER_BY_EMAIL_PORT,
  type IGetUserByEmailPort,
} from '../../ports/get-user-by-email.port';
import {
  ACCOUNTS_REPOSITORY,
  type IAccountsRepository,
} from '../../../domain/accounts.repository';
import {
  type IOutboxRepository,
  OUTBOX_REPOSITORY,
} from '../../../../../shared/modules/outbox/domain/outbox.repository';
import {
  type IUnitOfWork,
  UNIT_OF_WORK,
} from '../../../../../shared/modules/unit-of-work/unit-of-work';
import { PASSWORD_CHANGED_AUDIT_EVENT } from '../../../domain/events/password-changed.event';
import { ActorType } from '../../../../audit-logs/domain/enums/actor-type.enum';
import { auditEventPayload } from '../../../../audit-logs/domain/events/audit-event.payload';
import { EntityType } from '../../../../audit-logs/domain/enums/entity-type.enum';

@CommandHandler(ForgotPasswordCommand)
export class ForgotPasswordHandler implements ICommandHandler<ForgotPasswordCommand> {
  public constructor(
    @Inject(GET_USER_BY_EMAIL_PORT)
    private readonly getUserByEmailPort: IGetUserByEmailPort,

    @Inject(ACCOUNTS_REPOSITORY)
    private readonly accountsRepository: IAccountsRepository,

    @Inject(OUTBOX_REPOSITORY)
    private readonly outboxRepository: IOutboxRepository,

    @Inject(UNIT_OF_WORK)
    private readonly unitOfWork: IUnitOfWork,
  ) {}

  public async execute(command: ForgotPasswordCommand): Promise<void> {
    return this.unitOfWork.run(async () => {
      const user = await this.getUserByEmailPort.execute(command.email);

      if (!user) {
        throw new BadRequestException(
          `Email ${command.email} is not registered yet`,
        );
      }

      const account = await this.accountsRepository.findByUserId(user.id);

      if (!account) {
        throw new BadRequestException(
          `Email ${command.email} is not registered yet`,
        );
      }

      if (!account.getIsActive()) {
        throw new ConflictException('Account deactivated');
      }

      await account.restorePassword(command.password);

      await this.accountsRepository.update(account);

      await this.outboxRepository.create({
        eventType: PASSWORD_CHANGED_AUDIT_EVENT,
        payload: auditEventPayload(
          {
            actorId: account.getUserId(),
            actorType: ActorType.USER,
            actorLabel: user.email,
            userIp: command.ip,
            userAgent: command.userAgent,
          },
          {
            entityType: EntityType.ACCOUNTS,
            entityId: account.getId(),
          },
        ),
      });
    });
  }
}
