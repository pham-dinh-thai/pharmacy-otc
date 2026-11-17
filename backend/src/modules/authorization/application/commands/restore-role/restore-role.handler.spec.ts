import { afterEach, jest } from '@jest/globals';
import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { RestoreRoleHandler } from './restore-role.handler';
import { RestoreRoleCommand } from './restore-role.command';
import {
  type IRolesRepository,
  ROLES_REPOSITORY,
} from '../../../domain/roles.repository';
import {
  type IUnitOfWork,
  UNIT_OF_WORK,
} from '../../../../../shared/modules/unit-of-work/unit-of-work';
import {
  type IOutboxRepository,
  OUTBOX_REPOSITORY,
} from '../../../../../shared/modules/outbox/domain/outbox.repository';
import { Role } from '../../../domain/role.aggregate';
import { EntityType } from '../../../../audit-logs/domain/enums/entity-type.enum';

const headers = {
  actorId: '7d0d2c55-9a9d-4c7d-9f6a-3f7f5a1b2c3d',
  actorType: 'user',
  actorLabel: 'admin@example.com',
  userIp: '127.0.0.1',
  userAgent: 'jest',
};

const id = '4e770b20-0ab6-494a-9bfd-e475e07c7a17';
const deletedAt = new Date('2026-11-17T00:00:00.000Z');

const disabledRole = () => {
  let currentDeletedAt: Date | null = deletedAt;

  const restore = jest.fn(() => {
    currentDeletedAt = null;
  });

  const role = {
    getId: () => id,
    getDeletedAt: () => currentDeletedAt,
    restore,
  } as unknown as Role;

  return { role, restore };
};

describe('RestoreRoleHandler', () => {
  let handler: RestoreRoleHandler;
  let rolesRepository: jest.Mocked<
    Pick<IRolesRepository, 'findById' | 'update'>
  >;
  let outboxRepository: jest.Mocked<Pick<IOutboxRepository, 'create'>>;
  let unitOfWork: jest.Mocked<IUnitOfWork>;

  beforeEach(async () => {
    rolesRepository = {
      findById: jest.fn(),
      update: jest.fn(),
    } as unknown as jest.Mocked<Pick<IRolesRepository, 'findById' | 'update'>>;

    outboxRepository = {
      create: jest.fn(),
    } as unknown as jest.Mocked<Pick<IOutboxRepository, 'create'>>;

    unitOfWork = {
      run: jest.fn(async (callback: () => Promise<unknown>) => callback()),
    } as unknown as jest.Mocked<IUnitOfWork>;

    const moduleRef = await Test.createTestingModule({
      providers: [
        { provide: ROLES_REPOSITORY, useValue: rolesRepository },
        { provide: OUTBOX_REPOSITORY, useValue: outboxRepository },
        { provide: UNIT_OF_WORK, useValue: unitOfWork },
        RestoreRoleHandler,
      ],
    }).compile();

    handler = moduleRef.get(RestoreRoleHandler);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('throws NotFoundException when role does not exist', async () => {
    rolesRepository.findById.mockResolvedValue(null);

    await expect(
      handler.execute(new RestoreRoleCommand(id, headers)),
    ).rejects.toThrow(NotFoundException);

    expect(rolesRepository.update).not.toHaveBeenCalled();
    expect(outboxRepository.create).not.toHaveBeenCalled();
  });

  it('restores a disabled role and appends an event', async () => {
    const { role, restore } = disabledRole();

    rolesRepository.findById.mockResolvedValue(role);

    const result = await handler.execute(new RestoreRoleCommand(id, headers));

    expect(restore).toHaveBeenCalledTimes(1);
    expect(rolesRepository.update).toHaveBeenCalledWith(role);
    expect(outboxRepository.create.mock.calls).toEqual([
      [
        {
          eventType: 'role.restored',
          payload: {
            headers,
            audit: {
              entityType: EntityType.ROLES,
              entityId: id,
              before: { deletedAt },
              after: { deletedAt: null },
            },
          },
        },
      ],
    ]);
    expect(result).toEqual({ id });
  });
});
