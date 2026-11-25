import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ChangePasswordCommand } from './change-password.command';
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
  type IRefreshTokenStorePort,
  REFRESH_TOKEN_STORE_PORT,
} from '../../ports/refresh-token-store.port';
import { RecordAuditLogCommand } from '../../../../audit-logs/application/commands/record-audit-log/record-audit-log.command';
import { recordAuditProps } from '../../../../audit-logs/application/record-audit-log-props';
import { EntityType } from '../../../../audit-logs/domain/enums/entity-type.enum';

@CommandHandler(ChangePasswordCommand)
export class ChangePasswordHandler implements ICommandHandler<ChangePasswordCommand> {
  public constructor(
    @Inject(UNIT_OF_WORK)
    private readonly unitOfWork: IUnitOfWork,

    @Inject(ACCOUNTS_REPOSITORY)
    private readonly accountsRepository: IAccountsRepository,

    @Inject(REFRESH_TOKEN_STORE_PORT)
    private readonly refreshTokenStorePort: IRefreshTokenStorePort,

    private readonly commandBus: CommandBus,
  ) {}

  public async execute(command: ChangePasswordCommand): Promise<void> {
    await this.unitOfWork.run(async () => {
      const account = await this.accountsRepository.findByUserIdOrFail(
        command.headers.actorId,
      );

      await account.changePassword(
        command.currentPassword,
        command.newPassword,
        command.newPasswordConfirmation,
      );

      await this.accountsRepository.update(account);

      await this.commandBus.execute(
        new RecordAuditLogCommand(
          recordAuditProps(command.headers, {
            action: 'change_password',
            entityType: EntityType.ACCOUNTS,
            entityId: account.getId(),
          }),
        ),
      );
    });

    // Đổi mật khẩu phải đăng xuất mọi thiết bị khác. Access token cũ vẫn sống
    // tối đa 15 phút, nhưng refresh token thì bị thu hồi ngay.
    await this.refreshTokenStorePort.revokeAll(command.headers.actorId);
  }
}
