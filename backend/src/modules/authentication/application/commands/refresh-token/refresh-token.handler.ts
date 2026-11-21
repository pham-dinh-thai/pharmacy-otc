import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { RefreshTokenCommand } from './refresh-token.command';
import { Inject } from '@nestjs/common';
import {
  AuthAccountNotFoundException,
  AuthEmployeeResignedException,
  AuthUserNotFoundException,
  InvalidRefreshTokenException,
} from '../../../domain/exceptions/authentication.exceptions';
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
      throw new InvalidRefreshTokenException();
    }

    // Không xoay vòng refresh token ở đây. Nhiều request có thể refresh cùng
    // lúc (prefetch của Next.js); nếu token cũ bị thu hồi ngay thì các request
    // còn lại sẽ 401 và đẩy người dùng về /login. Token vẫn bị thu hồi khi
    // logout/đổi mật khẩu hoặc khi hết hạn.
    const user = await this.getUserByIdPort.execute(sub);
    if (!user) {
      throw new AuthUserNotFoundException();
    }

    const account = await this.accountsRepository.findByUserId(sub);
    if (!account) {
      throw new AuthAccountNotFoundException();
    }

    const status = await this.getEmploymentStatusPort.execute(sub);
    if (status === EmployeeStatus.RESIGNED) {
      throw new AuthEmployeeResignedException();
    }

    const mustChangePassword = account.getMustChangePassword();

    const accessToken = await this.signTokenPort.signAccessToken({
      sub,
      email: user.email,
      mustChangePassword,
    });

    return {
      accessToken,
      refreshToken: command.refreshToken,
      mustChangePassword,
    };
  }
}
