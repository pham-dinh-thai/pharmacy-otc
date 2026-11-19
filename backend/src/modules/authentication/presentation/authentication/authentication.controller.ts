import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Ip,
  Patch,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { RegisterRequest } from './requests/register.request';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { RegisterCommand } from '../../application/commands/register/register.command';
import type { CustomerProfileInput } from '../../../customers/domain/customer.aggregate';
import { LoginRequest } from './requests/login.request';
import { LoginCommand } from '../../application/commands/login/login.command';
import { RefreshTokenCommand } from '../../application/commands/refresh-token/refresh-token.command';
import { type Request, type Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { ForgotPasswordRequest } from './requests/forgot-password.request';
import { ForgotPasswordCommand } from '../../application/commands/forgot-password/forgot-password.command';
import { ChangePasswordRequest } from './requests/change-password.request';
import { ActorContext } from '../../../../shared/modules/security/actor-context.decorator';
import { type ActorHeaders } from '../../../../shared/types/actor-headers';
import { ChangePasswordCommand } from '../../application/commands/change-password/change-password.command';
import { AuthGuard } from '../../../../shared/modules/security/auth.guard';
import { RateLimitGuard } from '../../../../shared/modules/security/rate-limit.guard';
import { RateLimit } from '../../../../shared/modules/security/rate-limit.decorator';
import { LogoutCommand } from '../../application/commands/logout/logout.command';
import { CurrentUser } from '../../../../shared/modules/security/current-user.decorator';
import { GetUserByIdQuery } from '../../../users/application/queries/get-user-by-id/get-user-by-id.query';
import { GetActorPermissionsQuery } from '../../../authorization/application/queries/get-actor-permissions/get-actor-permissions.query';
import { CurrentUserResponse } from './responses/current-user.response';
import { AllowPasswordChangeRequired } from '../../../../shared/modules/security/allow-password-change-required.decorator';

const REFRESH_COOKIE = 'refresh_token';
const REFRESH_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'strict',
  path: '/api/authentication',
} as const;

@Controller('authentication')
@AllowPasswordChangeRequired()
export class AuthenticationController {
  public constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly configService: ConfigService,
  ) {}

  private setRefreshCookie(res: Response, token: string): void {
    res.cookie(REFRESH_COOKIE, token, {
      ...REFRESH_COOKIE_OPTIONS,
      secure: this.configService.get('NODE_ENV') === 'production',
      maxAge: REFRESH_MAX_AGE_MS,
    });
  }

  private clearRefreshCookie(res: Response): void {
    res.clearCookie(REFRESH_COOKIE, {
      ...REFRESH_COOKIE_OPTIONS,
      secure: this.configService.get('NODE_ENV') === 'production',
    });
  }

  @Post('/register')
  @UseGuards(RateLimitGuard)
  @RateLimit({
    points: 5,
    windowSeconds: 60,
    keyPrefix: 'register',
    keyBy: 'email',
  })
  public async register(
    @Body() request: RegisterRequest,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ): Promise<void> {
    return await this.commandBus.execute(
      new RegisterCommand(
        request.firstName,
        request.lastName,
        request.email,
        request.password,
        AuthenticationController.toCustomerProfile(request),
        ip,
        userAgent,
      ),
    );
  }

  @Post('/login')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RateLimitGuard)
  @RateLimit({
    points: 10,
    windowSeconds: 60,
    keyPrefix: 'login',
    keyBy: 'email',
  })
  public async login(
    @Body() request: LoginRequest,
    @Res({ passthrough: true }) res: Response,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ): Promise<{ accessToken: string; mustChangePassword: boolean }> {
    const { accessToken, refreshToken, mustChangePassword } =
      await this.commandBus.execute(
        new LoginCommand(request.email, request.password, ip, userAgent),
      );

    this.setRefreshCookie(res, refreshToken);

    return { accessToken, mustChangePassword };
  }

  @Get('/me')
  @UseGuards(AuthGuard)
  public async me(
    @CurrentUser('sub') sub: string,
    @CurrentUser('mustChangePassword') mustChangePassword: boolean,
  ): Promise<CurrentUserResponse> {
    const user = await this.queryBus.execute(new GetUserByIdQuery(sub));

    if (!user) {
      throw new UnauthorizedException('Authenticated user no longer exists');
    }

    const access = await this.queryBus.execute(
      new GetActorPermissionsQuery(sub),
    );

    return new CurrentUserResponse(
      user.id,
      user.firstName,
      user.lastName,
      user.email,
      access.isSuperAdmin,
      access.permissions,
      mustChangePassword,
    );
  }

  @Post('/refresh')
  @HttpCode(HttpStatus.OK)
  public async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ accessToken: string; mustChangePassword: boolean }> {
    const token: unknown = req.cookies?.[REFRESH_COOKIE];
    if (typeof token !== 'string' || !token) {
      throw new UnauthorizedException('Missing refresh token');
    }

    const { accessToken, refreshToken, mustChangePassword } =
      await this.commandBus.execute(new RefreshTokenCommand(token));
    this.setRefreshCookie(res, refreshToken);
    return { accessToken, mustChangePassword };
  }

  @Patch('/password/forgot')
  @UseGuards(RateLimitGuard)
  @RateLimit({
    points: 5,
    windowSeconds: 60,
    keyPrefix: 'forgot-password',
    keyBy: 'email',
  })
  public async forgotPassword(
    @Body() request: ForgotPasswordRequest,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ): Promise<void> {
    await this.commandBus.execute(
      new ForgotPasswordCommand(request.email, request.password, ip, userAgent),
    );
  }

  @UseGuards(AuthGuard, RateLimitGuard)
  @RateLimit({
    points: 10,
    windowSeconds: 60,
    keyPrefix: 'change-password',
    keyBy: 'actor',
  })
  @Patch('/password/change')
  public async changePassword(
    @Body() request: ChangePasswordRequest,
    @ActorContext() headers: ActorHeaders,
  ): Promise<void> {
    await this.commandBus.execute(
      new ChangePasswordCommand(
        request.currentPassword,
        request.newPassword,
        request.newPasswordConfirmation,
        headers,
      ),
    );
  }

  @Post('/logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  public async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    const refreshToken: unknown = req.cookies?.[REFRESH_COOKIE];

    try {
      if (typeof refreshToken === 'string' && refreshToken) {
        await this.commandBus.execute(new LogoutCommand(refreshToken));
      }
    } finally {
      this.clearRefreshCookie(res);
    }
  }

  private static toCustomerProfile(request: {
    gender?: CustomerProfileInput['gender'];
    dateOfBirth?: string | null;
    phones: { phone: string; isPrimary?: boolean }[];
    addresses: { address: string; isDefault?: boolean }[];
  }): CustomerProfileInput {
    return {
      gender: request.gender ?? null,
      dateOfBirth: request.dateOfBirth
        ? new Date(`${request.dateOfBirth}T00:00:00.000Z`)
        : null,
      phones: request.phones,
      addresses: request.addresses,
    };
  }
}
