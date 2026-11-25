import { jest } from '@jest/globals';
import { CommandBus } from '@nestjs/cqrs';
import { Test } from '@nestjs/testing';
import { CreateRoleHandler } from './create-role.handler';
import { CreateRoleCommand } from './create-role.command';
import {
  type IRolesRepository,
  ROLES_REPOSITORY,
} from '../../../domain/roles.repository';
import {
  type IUnitOfWork,
  UNIT_OF_WORK,
} from '../../../../../shared/modules/unit-of-work/unit-of-work';
import { RecordAuditLogCommand } from '../../../../audit-logs/application/commands/record-audit-log/record-audit-log.command';
import { EntityType } from '../../../../audit-logs/domain/enums/entity-type.enum';

const headers = {
  actorId: '7d0d2c55-9a9d-4c7d-9f6a-3f7f5a1b2c3d',
  actorType: 'user',
  actorLabel: 'admin@example.com',
  userIp: '127.0.0.1',
  userAgent: 'jest',
};

describe('CreateRoleHandler', () => {
  let handler: CreateRoleHandler;
  let rolesRepository: jest.Mocked<Pick<IRolesRepository, 'create'>>;
  let commandBus: jest.Mocked<Pick<CommandBus, 'execute'>>;
  let unitOfWork: jest.Mocked<IUnitOfWork>;

  beforeEach(async () => {
    rolesRepository = {
      create: jest.fn(),
    } as unknown as jest.Mocked<Pick<IRolesRepository, 'create'>>;

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
        CreateRoleHandler,
      ],
    }).compile();

    handler = moduleRef.get(CreateRoleHandler);
  });

  it('creates a role and returns its id', async () => {
    const result = await handler.execute(
      new CreateRoleCommand('manager', ['orders:read'], false, headers),
    );

    expect(rolesRepository.create).toHaveBeenCalledTimes(1);

    const role = rolesRepository.create.mock.calls[0][0];

    expect(role.getName()).toBe('manager');
    expect(role.getPermissions()).toEqual(['orders:read']);
    expect(role.getIsSuperAdmin()).toBe(false);
    expect(result).toEqual({ id: role.getId() });
  });

  it('records a create audit log inside the same unit of work', async () => {
    await handler.execute(
      new CreateRoleCommand('manager', ['orders:read'], false, headers),
    );

    const role = rolesRepository.create.mock.calls[0][0];

    expect(commandBus.execute).toHaveBeenCalledTimes(1);
    const auditCommand = commandBus.execute.mock.calls[0][0];

    expect(auditCommand).toBeInstanceOf(RecordAuditLogCommand);
    expect((auditCommand as RecordAuditLogCommand).props).toMatchObject({
      actorId: headers.actorId,
      actorType: 'user',
      actorLabel: headers.actorLabel,
      ipAddress: headers.userIp,
      userAgent: headers.userAgent,
      action: 'create',
      entityType: EntityType.ROLES,
      entityId: role.getId(),
      after: {
        name: 'manager',
        permissions: ['orders:read'],
        isSuperAdmin: false,
      },
    });
    expect(unitOfWork.run.mock.calls).toHaveLength(1);
  });

  it('does not record an audit log when the role write fails', async () => {
    rolesRepository.create.mockRejectedValue(new Error('write failed'));

    await expect(
      handler.execute(
        new CreateRoleCommand('manager', ['orders:read'], false, headers),
      ),
    ).rejects.toThrow('write failed');

    expect(commandBus.execute).not.toHaveBeenCalled();
  });
});
