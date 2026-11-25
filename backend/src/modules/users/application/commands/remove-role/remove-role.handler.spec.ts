import { jest } from '@jest/globals';
import { CommandBus } from '@nestjs/cqrs';
import { UserByIdNotFoundException } from '../../../domain/exceptions/user.exceptions';
import { Test } from '@nestjs/testing';
import { RemoveRoleHandler } from './remove-role.handler';
import { RemoveRoleCommand } from './remove-role.command';
import {
  type IUsersRepository,
  USERS_REPOSITORY,
} from '../../../domain/users.repository';
import {
  type IUnitOfWork,
  UNIT_OF_WORK,
} from '../../../../../shared/modules/unit-of-work/unit-of-work';
import { RecordAuditLogCommand } from '../../../../audit-logs/application/commands/record-audit-log/record-audit-log.command';
import { User } from '../../../domain/user.aggregate';
import { EntityType } from '../../../../audit-logs/domain/enums/entity-type.enum';

const headers = {
  actorId: '7d0d2c55-9a9d-4c7d-9f6a-3f7f5a1b2c3d',
  actorType: 'user',
  actorLabel: 'admin@example.com',
  userIp: '127.0.0.1',
  userAgent: 'jest',
};

describe('RemoveRoleHandler', () => {
  let handler: RemoveRoleHandler;
  let usersRepository: jest.Mocked<
    Pick<IUsersRepository, 'findById' | 'update'>
  >;
  let commandBus: jest.Mocked<Pick<CommandBus, 'execute'>>;
  let unitOfWork: jest.Mocked<IUnitOfWork>;

  const userId = '4e770b20-0ab6-494a-9bfd-e475e07c7a17';
  const roleId = '1c2e9d5b-2c3a-4d6e-9f8a-0b1c2d3e4f50';

  beforeEach(async () => {
    usersRepository = {
      findById: jest.fn(),
      update: jest.fn(),
    } as unknown as jest.Mocked<Pick<IUsersRepository, 'findById' | 'update'>>;

    commandBus = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<Pick<CommandBus, 'execute'>>;

    unitOfWork = {
      run: jest.fn(async (callback: () => Promise<unknown>) => callback()),
    } as unknown as jest.Mocked<IUnitOfWork>;

    const moduleRef = await Test.createTestingModule({
      providers: [
        { provide: USERS_REPOSITORY, useValue: usersRepository },
        { provide: CommandBus, useValue: commandBus },
        { provide: UNIT_OF_WORK, useValue: unitOfWork },
        RemoveRoleHandler,
      ],
    }).compile();

    handler = moduleRef.get(RemoveRoleHandler);
  });

  it('throws NotFoundException when user does not exist', async () => {
    usersRepository.findById.mockResolvedValue(null);

    await expect(
      handler.execute(new RemoveRoleCommand(userId, roleId, headers)),
    ).rejects.toThrow(UserByIdNotFoundException);

    expect(usersRepository.update).not.toHaveBeenCalled();
    expect(commandBus.execute).not.toHaveBeenCalled();
  });

  it('removes the role and records an audit log', async () => {
    const user = User.create({
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'jane@example.com',
      roleIds: [roleId],
    });

    usersRepository.findById.mockResolvedValue(user);

    const result = await handler.execute(
      new RemoveRoleCommand(userId, roleId, headers),
    );

    expect(user.getRoleIds()).toEqual([]);
    expect(usersRepository.update).toHaveBeenCalledWith(user);
    expect(commandBus.execute).toHaveBeenCalledTimes(1);
    const auditCommand = commandBus.execute.mock.calls[0][0];

    expect(auditCommand).toBeInstanceOf(RecordAuditLogCommand);
    expect((auditCommand as RecordAuditLogCommand).props).toMatchObject({
      actorId: headers.actorId,
      actorType: 'user',
      actorLabel: headers.actorLabel,
      ipAddress: headers.userIp,
      userAgent: headers.userAgent,
      action: 'remove_role',
      entityType: EntityType.USERS,
      entityId: user.getId(),
      before: { roleIds: [roleId] },
      after: { roleIds: [] },
      metadata: { roleId },
    });
    expect(result).toEqual({ id: user.getId(), roleIds: [] });
  });
});
