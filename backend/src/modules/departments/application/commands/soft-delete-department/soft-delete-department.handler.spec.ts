import { jest } from '@jest/globals';
import {
  DepartmentAlreadyDisabledException,
  DepartmentNotFoundException,
} from '../../../domain/exceptions/department.exceptions';
import { Test } from '@nestjs/testing';
import { SoftDeleteDepartmentHandler } from './soft-delete-department.handler';
import { SoftDeleteDepartmentCommand } from './soft-delete-department.command';
import { DEPARTMENTS_REPOSITORY } from '../../../domain/departments.repository';
import { Department } from '../../../domain/department.aggregate';
import {
  OUTBOX_REPOSITORY,
  type IOutboxRepository,
} from '../../../../../shared/modules/outbox/domain/outbox.repository';
import { UNIT_OF_WORK } from '../../../../../shared/modules/unit-of-work/unit-of-work';
import { DEPARTMENT_DISABLED_EVENT } from '../../../domain/events/department-disabled.event';
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
    name: 'Pharmacy',
    createdAt: new Date('2026-11-17T00:00:00.000Z'),
    updatedAt: new Date('2026-11-17T00:00:00.000Z'),
  });

describe('SoftDeleteDepartmentHandler', () => {
  let handler: SoftDeleteDepartmentHandler;
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
        SoftDeleteDepartmentHandler,
      ],
    }).compile();

    handler = moduleRef.get(SoftDeleteDepartmentHandler);
  });

  it('throws NotFoundException when the department does not exist', async () => {
    findById.mockResolvedValue(null);

    await expect(
      handler.execute(new SoftDeleteDepartmentCommand(DEPARTMENT_ID, headers)),
    ).rejects.toThrow(DepartmentNotFoundException);

    expect(update).not.toHaveBeenCalled();
    expect(outboxCreate).not.toHaveBeenCalled();
  });

  it('soft-deletes the department and appends the audit event', async () => {
    const result = await handler.execute(
      new SoftDeleteDepartmentCommand(DEPARTMENT_ID, headers),
    );

    expect(result).toEqual({ id: DEPARTMENT_ID });
    expect(update).toHaveBeenCalledTimes(1);
    expect(update.mock.calls[0][0].isDeleted()).toBe(true);
    expect(outboxCreate).toHaveBeenCalledWith({
      eventType: DEPARTMENT_DISABLED_EVENT,
      payload: {
        headers,
        audit: {
          entityType: EntityType.DEPARTMENTS,
          entityId: DEPARTMENT_ID,
          before: { name: 'Pharmacy', deletedAt: null },
          after: {
            name: 'Pharmacy',
            deletedAt: update.mock.calls[0][0].getDeletedAt(),
          },
        },
      },
    });
  });

  it('rejects a second soft-delete', async () => {
    const disabled = department();
    disabled.softDelete();
    findById.mockResolvedValue(disabled);

    await expect(
      handler.execute(new SoftDeleteDepartmentCommand(DEPARTMENT_ID, headers)),
    ).rejects.toThrow(DepartmentAlreadyDisabledException);

    expect(update).not.toHaveBeenCalled();
    expect(outboxCreate).not.toHaveBeenCalled();
  });
});
