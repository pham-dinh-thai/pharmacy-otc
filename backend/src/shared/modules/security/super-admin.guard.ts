import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { type AccessTokenPayload } from '../../../modules/authentication/application/ports/sign-token.port';
import { GetActorPermissionsQuery } from '../../../modules/authorization/application/queries/get-actor-permissions/get-actor-permissions.query';

@Injectable()
export class SuperAdminGuard implements CanActivate {
  public constructor(private readonly queryBus: QueryBus) {}

  public async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<{ user?: AccessTokenPayload }>();

    const sub = request.user?.sub;
    if (!sub) {
      throw new UnauthorizedException('Missing access token');
    }

    try {
      const actor = await this.queryBus.execute(
        new GetActorPermissionsQuery(sub),
      );

      if (actor.isSuperAdmin) {
        return true;
      }
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new UnauthorizedException('Authenticated user no longer exists');
      }

      throw error;
    }

    throw new ForbiddenException('Super Admin role required');
  }
}
