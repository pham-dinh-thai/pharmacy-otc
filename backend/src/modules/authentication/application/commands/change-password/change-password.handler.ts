import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
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
  type IOutboxRepository,
  OUTBOX_REPOSITORY,
} from '../../../../../shared/modules/outbox/domain/outbox.repository';
import {
  type IRefreshTokenStorePort,
  REFRESH_TOKEN_STORE_PORT,
} from '../../ports/refresh-token-store.port';
import { PASSWORD_CHANGED_AUDIT_EVENT } from '../../../domain/events/password-changed.event';
import { auditEventPayload } from '../../../../audit-logs/domain/events/audit-event.payload';
import { EntityType } from '../../../../audit-logs/domain/enums/entity-type.enum';

@CommandHandler(ChangePasswordCommand)
export class ChangePasswordHandler implements ICommandHandler<ChangePasswordCommand> {
  public constructor(
    @Inject(UNIT_OF_WORK)
    private readonly unitOfWork: IUnitOfWork,

    @Inject(ACCOUNTS_REPOSITORY)
    private readonly accountsRepository: IAccountsRepository,

    @Inject(OUTBOX_REPOSITORY)
    private readonly outboxRepository: IOutboxRepository,

    @Inject(REFRESH_TOKEN_STORE_PORT)
    private readonly refreshTokenStorePort: IRefreshTokenStorePort,
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

      await this.outboxRepository.create({
        eventType: PASSWORD_CHANGED_AUDIT_EVENT,
        payload: auditEventPayload(command.headers, {
          entityType: EntityType.ACCOUNTS,
          entityId: account.getId(),
        }),
      });
    });

    // Đổi mật khẩu phải đăng xuất mọi thiết bị khác. Access token cũ vẫn sống
    // tối đa 15 phút, nhưng refresh token thì bị thu hồi ngay.
    await this.refreshTokenStorePort.revokeAll(command.headers.actorId);
  }
}
