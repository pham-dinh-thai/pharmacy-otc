import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { LogoutCommand } from './logout.command';
import { Inject } from '@nestjs/common';
import {
  type IRefreshTokenVerifyPort,
  REFRESH_TOKEN_VERIFY_PORT,
} from '../refresh-token/ports/refresh-token-verify.port';
import {
  type IRefreshTokenStorePort,
  REFRESH_TOKEN_STORE_PORT,
} from '../../ports/refresh-token-store.port';

@CommandHandler(LogoutCommand)
export class LogoutHandler implements ICommandHandler<LogoutCommand> {
  public constructor(
    @Inject(REFRESH_TOKEN_VERIFY_PORT)
    private readonly refreshTokenVerifyPort: IRefreshTokenVerifyPort,

    @Inject(REFRESH_TOKEN_STORE_PORT)
    private readonly refreshTokenStorePort: IRefreshTokenStorePort,
  ) {}

  public async execute(command: LogoutCommand): Promise<void> {
    let payload: { sub: string; jti: string };

    try {
      payload = await this.refreshTokenVerifyPort.verify(command.refreshToken);
    } catch {
      return; // Refresh token expired/invalid. Nothing to revoke
    }

    await this.refreshTokenStorePort.revoke(payload.sub, payload.jti);
  }
}
