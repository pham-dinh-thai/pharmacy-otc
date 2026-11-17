import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { RefreshTokenCommand } from './refresh-token.command';
import { Inject, UnauthorizedException } from '@nestjs/common';
import {
  type IRefreshTokenVerifyPort,
  REFRESH_TOKEN_VERIFY_PORT,
} from './ports/refresh-token-verify.port';
import {
  type IRefreshTokenStorePort,
  REFRESH_TOKEN_STORE_PORT,
} from '../../ports/refresh-token-store.port';
import {
  GET_USER_BY_ID_PORT,
  type IGetUserByIdPort,
} from './ports/get-user-by-id-port';
import {
  type ISignTokenPort,
  SIGN_TOKEN_PORT,
} from '../../ports/sign-token.port';
import {
  ACCOUNTS_REPOSITORY,
  type IAccountsRepository,
} from '../../../domain/accounts.repository';
import { randomUUID } from 'crypto';
import { EmployeeStatus } from '../../../../employees/domain/enums/employee-status.enum';
import {
  GET_EMPLOYMENT_STATUS_PORT,
  type IGetEmploymentStatusPort,
} from '../../ports/get-employment-status.port';

@CommandHandler(RefreshTokenCommand)
export class RefreshTokenHandler implements ICommandHandler<RefreshTokenCommand> {
  public constructor(
    @Inject(REFRESH_TOKEN_VERIFY_PORT)
    private readonly refreshTokenVerifyPort: IRefreshTokenVerifyPort,

    @Inject(REFRESH_TOKEN_STORE_PORT)
    private readonly refreshTokenStorePort: IRefreshTokenStorePort,

    @Inject(GET_USER_BY_ID_PORT)
    private readonly getUserByIdPort: IGetUserByIdPort,

    @Inject(GET_EMPLOYMENT_STATUS_PORT)
    private readonly getEmploymentStatusPort: IGetEmploymentStatusPort,

    @Inject(ACCOUNTS_REPOSITORY)
    private readonly accountsRepository: IAccountsRepository,

    @Inject(SIGN_TOKEN_PORT)
    private readonly signTokenPort: ISignTokenPort,
  ) {}

  public async execute(command: RefreshTokenCommand): Promise<{
    accessToken: string;
    refreshToken: string;
    mustChangePassword: boolean;
  }> {
    const { sub, jti } = await this.refreshTokenVerifyPort.verify(
      command.refreshToken,
    );

    const isMatches = await this.refreshTokenStorePort.matches(
      sub,
      jti,
      command.refreshToken,
    );
    if (!isMatches) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    await this.refreshTokenStorePort.revoke(sub, jti);

    const user = await this.getUserByIdPort.execute(sub);
    if (!user) {
      throw new UnauthorizedException('User Not Found');
    }

    const account = await this.accountsRepository.findByUserId(sub);
    if (!account) {
      throw new UnauthorizedException('Account Not Found');
    }

    const status = await this.getEmploymentStatusPort.execute(sub);
    if (status === EmployeeStatus.RESIGNED) {
      throw new UnauthorizedException('Employee resigned');
    }

    const mustChangePassword = account.getMustChangePassword();

    const newJti = randomUUID();
    const { accessToken, refreshToken } = await this.signTokenPort.sign(
      {
        sub,
        email: user.email,
        mustChangePassword,
      },
      {
        sub,
        jti: newJti,
      },
    );

    await this.refreshTokenStorePort.save(
      sub,
      newJti,
      refreshToken,
      7 * 24 * 60 * 60,
    );

    return { accessToken, refreshToken, mustChangePassword };
  }
}
