import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ForgotPasswordCommand } from './forgot-password.command';
import { Inject } from '@nestjs/common';
import {
  GET_USER_BY_EMAIL_PORT,
  type IGetUserByEmailPort,
} from '../../ports/get-user-by-email.port';
import {
  ACCOUNTS_REPOSITORY,
  type IAccountsRepository,
} from '../../../domain/accounts.repository';
import {
  type IUnitOfWork,
  UNIT_OF_WORK,
} from '../../../../../shared/modules/unit-of-work/unit-of-work';
import {
  type IRefreshTokenStorePort,
  REFRESH_TOKEN_STORE_PORT,
} from '../../ports/refresh-token-store.port';
import { RecordAuditLogCommand } from '../../../../audit-logs/application/commands/record-audit-log/record-audit-log.command';
import { recordAuditProps } from '../../../../audit-logs/application/record-audit-log-props';
import { ActorType } from '../../../../audit-logs/domain/enums/actor-type.enum';
import { EntityType } from '../../../../audit-logs/domain/enums/entity-type.enum';

@CommandHandler(ForgotPasswordCommand)
export class ForgotPasswordHandler implements ICommandHandler<ForgotPasswordCommand> {
  public constructor(
    @Inject(GET_USER_BY_EMAIL_PORT)
    private readonly getUserByEmailPort: IGetUserByEmailPort,

    @Inject(ACCOUNTS_REPOSITORY)
    private readonly accountsRepository: IAccountsRepository,

    @Inject(UNIT_OF_WORK)
    private readonly unitOfWork: IUnitOfWork,

    @Inject(REFRESH_TOKEN_STORE_PORT)
    private readonly refreshTokenStorePort: IRefreshTokenStorePort,

    private readonly commandBus: CommandBus,
  ) {}

  public async execute(command: ForgotPasswordCommand): Promise<void> {
    // Trả về null thay vì ném lỗi khi email không tồn tại, để response không
    // tiết lộ tài khoản nào đã đăng ký (chống user enumeration).
    const userId = await this.unitOfWork.run(async () => {
      const user = await this.getUserByEmailPort.execute(command.email);

      if (!user) {
        return null;
      }

      const account = await this.accountsRepository.findByUserId(user.id);

      if (!account || !account.getIsActive()) {
        return null;
      }

      await account.restorePassword(command.password);

      await this.accountsRepository.update(account);

      await this.commandBus.execute(
        new RecordAuditLogCommand(
          recordAuditProps(
            {
              actorId: account.getUserId(),
              actorType: ActorType.SYSTEM,
              actorLabel: user.email,
              userIp: command.ip,
              userAgent: command.userAgent,
            },
            {
              action: 'change_password',
              entityType: EntityType.ACCOUNTS,
              entityId: account.getId(),
              reason: 'password_reset',
            },
          ),
        ),
      );

      return account.getUserId();
    });

    if (userId) {
      await this.refreshTokenStorePort.revokeAll(userId);
    }
  }
}
