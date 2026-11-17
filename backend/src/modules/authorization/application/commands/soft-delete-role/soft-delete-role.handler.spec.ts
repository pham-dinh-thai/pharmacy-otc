import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { SoftDeleteRoleHandler } from './soft-delete-role.handler';
import { SoftDeleteRoleCommand } from './soft-delete-role.command';
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
const createdAt = new Date('2026-11-16T00:00:00.000Z');
const updatedAt = new Date('2026-11-16T00:00:00.000Z');
const deletedAt = new Date('2026-11-17T00:00:00.000Z');

const persistentRole = (isSuperAdmin = false, name = 'manager') =>
  Role.fromPersistent({
    id,
    name,
    permissions: [],
    isSuperAdmin,
    createdAt,
    updatedAt,
    deletedAt: null,
  });

describe('SoftDeleteRoleHandler', () => {
  let handler: SoftDeleteRoleHandler;
  let rolesRepository: jest.Mocked<
    Pick<IRolesRepository, 'findById' | 'update'>
  >;
  let outboxRepository: jest.Mocked<Pick<IOutboxRepository, 'create'>>;
  let unitOfWork: jest.Mocked<IUnitOfWork>;

  beforeEach(async () => {
    jest.useFakeTimers();
    jest.setSystemTime(deletedAt);

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
        SoftDeleteRoleHandler,
      ],
    }).compile();

    handler = moduleRef.get(SoftDeleteRoleHandler);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('throws NotFoundException when role does not exist', async () => {
    rolesRepository.findById.mockResolvedValue(null);

    await expect(
      handler.execute(new SoftDeleteRoleCommand(id, headers)),
    ).rejects.toThrow(NotFoundException);

    expect(rolesRepository.update).not.toHaveBeenCalled();
    expect(outboxRepository.create).not.toHaveBeenCalled();
  });

  it('refuses to disable a Super Admin', async () => {
    const role = persistentRole(true, 'Super Admin');

    rolesRepository.findById.mockResolvedValue(role);

    await expect(
      handler.execute(new SoftDeleteRoleCommand(id, headers)),
    ).rejects.toThrow(ConflictException);

    expect(role.isDeleted()).toBe(false);
    expect(rolesRepository.update).not.toHaveBeenCalled();
    expect(outboxRepository.create).not.toHaveBeenCalled();
  });

  it('disables a regular role and appends an event', async () => {
    const role = persistentRole(false);

    rolesRepository.findById.mockResolvedValue(role);

    const result = await handler.execute(
      new SoftDeleteRoleCommand(id, headers),
    );

    expect(role.isDeleted()).toBe(true);
    expect(rolesRepository.update).toHaveBeenCalledWith(role);
    expect(outboxRepository.create.mock.calls).toEqual([
      [
        {
          eventType: 'role.disabled',
          payload: {
            headers,
            audit: {
              entityType: EntityType.ROLES,
              entityId: id,
              before: {
                name: 'manager',
                isSuperAdmin: false,
                deletedAt: null,
              },
              after: {
                name: 'manager',
                isSuperAdmin: false,
                deletedAt,
              },
            },
          },
        },
      ],
    ]);
    expect(result).toEqual({ id });
  });
});
