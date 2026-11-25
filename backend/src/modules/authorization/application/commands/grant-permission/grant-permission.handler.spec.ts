import { jest } from '@jest/globals';
import { CommandBus } from '@nestjs/cqrs';
import { RoleNotFoundException } from '../../../domain/exceptions/role.exceptions';
import { Test } from '@nestjs/testing';
import { GrantPermissionHandler } from './grant-permission.handler';
import { GrantPermissionCommand } from './grant-permission.command';
import {
  type IRolesRepository,
  ROLES_REPOSITORY,
} from '../../../domain/roles.repository';
import {
  type IUnitOfWork,
  UNIT_OF_WORK,
} from '../../../../../shared/modules/unit-of-work/unit-of-work';
import { RecordAuditLogCommand } from '../../../../audit-logs/application/commands/record-audit-log/record-audit-log.command';
import { Role } from '../../../domain/role.aggregate';
import { EntityType } from '../../../../audit-logs/domain/enums/entity-type.enum';

const headers = {
  actorId: '7d0d2c55-9a9d-4c7d-9f6a-3f7f5a1b2c3d',
  actorType: 'user',
  actorLabel: 'admin@example.com',
  userIp: '127.0.0.1',
  userAgent: 'jest',
};

describe('GrantPermissionHandler', () => {
  let handler: GrantPermissionHandler;
  let rolesRepository: jest.Mocked<
    Pick<IRolesRepository, 'findById' | 'update'>
  >;
  let commandBus: jest.Mocked<Pick<CommandBus, 'execute'>>;
  let unitOfWork: jest.Mocked<IUnitOfWork>;

  const id = '4e770b20-0ab6-494a-9bfd-e475e07c7a17';

  beforeEach(async () => {
    rolesRepository = {
      findById: jest.fn(),
      update: jest.fn(),
    } as unknown as jest.Mocked<Pick<IRolesRepository, 'findById' | 'update'>>;

    commandBus = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<Pick<CommandBus, 'execute'>>;

    unitOfWork = {
      run: jest.fn(async (callback: () => Promise<unknown>) => callback()),
    } as unknown as jest.Mocked<IUnitOfWork>;

    const moduleRef = await Test.createTestingModule({
      providers: [
        { provide: ROLES_REPOSITORY, useValue: rolesRepository },
        { provide: CommandBus, useValue: commandBus },
        { provide: UNIT_OF_WORK, useValue: unitOfWork },
        GrantPermissionHandler,
      ],
    }).compile();

    handler = moduleRef.get(GrantPermissionHandler);
  });

  it('throws NotFoundException when role does not exist', async () => {
    rolesRepository.findById.mockResolvedValue(null);

    await expect(
      handler.execute(
        new GrantPermissionCommand(id, 'orders:process', headers),
      ),
    ).rejects.toThrow(RoleNotFoundException);

    expect(rolesRepository.update).not.toHaveBeenCalled();
    expect(commandBus.execute).not.toHaveBeenCalled();
  });

  it('grants the permission, persists the role and records an audit log', async () => {
    const grant = jest.fn();
    const createdAt = new Date('2026-11-11T00:00:00.000Z');
    const role = {
      getId: () => id,
      getName: () => 'manager',
      getPermissions: () => ['orders:process'],
      getIsSuperAdmin: () => false,
      getCreatedAt: () => createdAt,
      grant,
    } as unknown as Role;

    rolesRepository.findById.mockResolvedValue(role);

    const result = await handler.execute(
      new GrantPermissionCommand(id, 'orders:process', headers),
    );

    expect(grant).toHaveBeenCalledWith('orders:process');
    expect(rolesRepository.update).toHaveBeenCalledWith(role);
    expect(commandBus.execute).toHaveBeenCalledTimes(1);
    const auditCommand = commandBus.execute.mock.calls[0][0];

    expect(auditCommand).toBeInstanceOf(RecordAuditLogCommand);
    expect((auditCommand as RecordAuditLogCommand).props).toMatchObject({
      actorId: headers.actorId,
      actorType: 'user',
      actorLabel: headers.actorLabel,
      ipAddress: headers.userIp,
      userAgent: headers.userAgent,
      action: 'grant_permission',
      entityType: EntityType.ROLES,
      entityId: id,
      before: { permissions: ['orders:process'] },
      after: { permissions: ['orders:process'] },
      metadata: { permission: 'orders:process' },
    });
    expect(result).toEqual({ id });
  });
});
