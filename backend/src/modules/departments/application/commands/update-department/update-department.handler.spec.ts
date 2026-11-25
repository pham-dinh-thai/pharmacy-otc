import { jest } from '@jest/globals';
import { CommandBus } from '@nestjs/cqrs';
import {
  DepartmentDisabledException,
  DepartmentNotFoundException,
} from '../../../domain/exceptions/department.exceptions';
import { Test } from '@nestjs/testing';
import { UpdateDepartmentHandler } from './update-department.handler';
import { UpdateDepartmentCommand } from './update-department.command';
import { DEPARTMENTS_REPOSITORY } from '../../../domain/departments.repository';
import { Department } from '../../../domain/department.aggregate';
import { UNIT_OF_WORK } from '../../../../../shared/modules/unit-of-work/unit-of-work';
import { RecordAuditLogCommand } from '../../../../audit-logs/application/commands/record-audit-log/record-audit-log.command';
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
  let execute: jest.Mock<CommandBus['execute']>;

  beforeEach(async () => {
    findById = jest.fn(() => Promise.resolve(department()));
    update = jest.fn((value) => Promise.resolve(value));
    execute = jest.fn<CommandBus['execute']>().mockResolvedValue({
      id: 'audit-id',
    });

    const moduleRef = await Test.createTestingModule({
      providers: [
        {
          provide: DEPARTMENTS_REPOSITORY,
          useValue: {
            findPage: jest.fn(),
            findById,
            create: jest.fn(),
            update,
          },
        },
        { provide: CommandBus, useValue: { execute } },
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
    ).rejects.toThrow(DepartmentNotFoundException);

    expect(update).not.toHaveBeenCalled();
    expect(execute).not.toHaveBeenCalled();
  });

  it('renames the department and appends the audit event', async () => {
    const result = await handler.execute(
      new UpdateDepartmentCommand(DEPARTMENT_ID, '  New  ', headers),
    );

    expect(result).toEqual({ id: DEPARTMENT_ID, name: 'New' });
    expect(update).toHaveBeenCalledTimes(1);
    expect(execute).toHaveBeenCalledTimes(1);

    const auditCommand = execute.mock.calls[0][0];

    expect(auditCommand).toBeInstanceOf(RecordAuditLogCommand);
    expect((auditCommand as RecordAuditLogCommand).props).toMatchObject({
      actorId: headers.actorId,
      action: 'update',
      entityType: EntityType.DEPARTMENTS,
      entityId: DEPARTMENT_ID,
      before: { name: 'Old' },
      after: { name: 'New' },
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
    ).rejects.toThrow(DepartmentDisabledException);

    expect(update).not.toHaveBeenCalled();
    expect(execute).not.toHaveBeenCalled();
  });
});
