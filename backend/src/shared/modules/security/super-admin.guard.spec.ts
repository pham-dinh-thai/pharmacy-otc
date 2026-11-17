import { describe, expect, it, jest } from '@jest/globals';
import {
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
  type ExecutionContext,
} from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { GetActorPermissionsQuery } from '../../../modules/authorization/application/queries/get-actor-permissions/get-actor-permissions.query';
import { GetActorPermissionsReadModel } from '../../../modules/authorization/application/queries/get-actor-permissions/get-actor-permissions.read-model';
import { type PermissionKey } from '../../../modules/authorization/domain/permission/permission-catalog';
import { SuperAdminGuard } from './super-admin.guard';

const contextWith = (sub?: string): ExecutionContext =>
  ({
    switchToHttp: () => ({
      getRequest: () => ({ user: sub ? { sub } : undefined }),
    }),
  }) as unknown as ExecutionContext;

const actorOf = (isSuperAdmin: boolean, permissions: PermissionKey[] = []) =>
  new GetActorPermissionsReadModel('actor-1', permissions, isSuperAdmin);

type Execute = (
  query: GetActorPermissionsQuery,
) => Promise<GetActorPermissionsReadModel>;

const setup = () => {
  const execute = jest.fn<Execute>();

  return {
    guard: new SuperAdminGuard({ execute } as unknown as QueryBus),
    execute,
  };
};

describe('SuperAdminGuard', () => {
  it('rejects a request without an authenticated actor', async () => {
    const { guard, execute } = setup();

    await expect(guard.canActivate(contextWith())).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(execute).not.toHaveBeenCalled();
  });

  it('allows a super admin', async () => {
    const { guard, execute } = setup();
    execute.mockResolvedValue(actorOf(true));

    await expect(guard.canActivate(contextWith('actor-1'))).resolves.toBe(true);
  });

  it('rejects a non-super admin even with every role permission', async () => {
    const { guard, execute } = setup();
    execute.mockResolvedValue(
      actorOf(false, [
        'roles:read',
        'roles:create',
        'roles:update',
        'roles:delete',
        'roles:manage',
      ]),
    );

    await expect(
      guard.canActivate(contextWith('actor-1')),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('turns a missing actor into 401 instead of 404', async () => {
    const { guard, execute } = setup();
    execute.mockRejectedValue(new NotFoundException('User not found'));

    await expect(
      guard.canActivate(contextWith('actor-1')),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
