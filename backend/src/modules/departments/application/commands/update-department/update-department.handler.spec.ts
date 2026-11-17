import { jest } from '@jest/globals';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { UpdateDepartmentHandler } from './update-department.handler';
import { UpdateDepartmentCommand } from './update-department.command';
import { DEPARTMENTS_REPOSITORY } from '../../../domain/departments.repository';
import { Department } from '../../../domain/department.aggregate';
import {
  OUTBOX_REPOSITORY,
  type IOutboxRepository,
} from '../../../../../shared/modules/outbox/domain/outbox.repository';
import { UNIT_OF_WORK } from '../../../../../shared/modules/unit-of-work/unit-of-work';
import { DEPARTMENT_UPDATED_EVENT } from '../../../domain/events/department-updated.event';
import { EntityType } from '../../../../audit-logs/domain/enums/entity-type.enum';

const headers = {
  actorId: '7d0d2c55-9a9d-4c7d-9f6a-3f7f5a1b2c3d',
  actorType: 'user',
  actorLabel: 'admin@example.com',
  userIp: '127.0.0.1',
  userAgent: 'jest',
};

const DEPARTMENT_ID = '4e770b20-0ab6-494a-9bfd-e475e07c7a17';

const department = (): Department =>
  Department.fromPersistent({
    id: DEPARTMENT_ID,
    name: 'Old',
    createdAt: new Date('2026-11-17T00:00:00.000Z'),
    updatedAt: new Date('2026-11-17T00:00:00.000Z'),
  });

describe('UpdateDepartmentHandler', () => {
  let handler: UpdateDepartmentHandler;
  let findById: jest.Mock<(id: string) => Promise<Department | null>>;
  let update: jest.Mock<(department: Department) => Promise<Department>>;
  let outboxCreate: jest.Mock<IOutboxRepository['create']>;

  beforeEach(async () => {
    findById = jest.fn(() => Promise.resolve(department()));
    update = jest.fn((value) => Promise.resolve(value));
    outboxCreate = jest.fn<IOutboxRepository['create']>();

    const moduleRef = await Test.createTestingModule({
      providers: [
        {
          provide: DEPARTMENTS_REPOSITORY,
          useValue: {
            findAll: jest.fn(),
            findById,
            create: jest.fn(),
            update,
          },
        },
        { provide: OUTBOX_REPOSITORY, useValue: { create: outboxCreate } },
        {
          provide: UNIT_OF_WORK,
          useValue: {
            run: (work: () => Promise<unknown>) => work(),
          },
        },
        UpdateDepartmentHandler,
      ],
    }).compile();

    handler = moduleRef.get(UpdateDepartmentHandler);
  });

  it('throws NotFoundException when the department does not exist', async () => {
    findById.mockResolvedValue(null);

    await expect(
      handler.execute(
        new UpdateDepartmentCommand(DEPARTMENT_ID, 'New', headers),
      ),
    ).rejects.toThrow(NotFoundException);

    expect(update).not.toHaveBeenCalled();
    expect(outboxCreate).not.toHaveBeenCalled();
  });

  it('renames the department and appends the audit event', async () => {
    const result = await handler.execute(
      new UpdateDepartmentCommand(DEPARTMENT_ID, '  New  ', headers),
    );

    expect(result).toEqual({ id: DEPARTMENT_ID, name: 'New' });
    expect(update).toHaveBeenCalledTimes(1);
    expect(outboxCreate).toHaveBeenCalledWith({
      eventType: DEPARTMENT_UPDATED_EVENT,
      payload: {
        headers,
        audit: {
          entityType: EntityType.DEPARTMENTS,
          entityId: DEPARTMENT_ID,
          before: { name: 'Old' },
          after: { name: 'New' },
        },
      },
    });
  });

  it('refuses to rename a disabled department', async () => {
    const disabled = department();
    disabled.softDelete();
    findById.mockResolvedValue(disabled);

    await expect(
      handler.execute(
        new UpdateDepartmentCommand(DEPARTMENT_ID, 'New', headers),
      ),
    ).rejects.toThrow(ConflictException);

    expect(update).not.toHaveBeenCalled();
    expect(outboxCreate).not.toHaveBeenCalled();
  });
});
