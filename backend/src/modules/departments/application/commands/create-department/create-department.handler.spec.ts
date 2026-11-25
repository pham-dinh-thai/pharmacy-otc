import { jest } from '@jest/globals';
import { CommandBus } from '@nestjs/cqrs';
import { DepartmentNameRequiredException } from '../../../domain/exceptions/department.exceptions';
import { Test } from '@nestjs/testing';
import { CreateDepartmentHandler } from './create-department.handler';
import { CreateDepartmentCommand } from './create-department.command';
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

describe('CreateDepartmentHandler', () => {
  let handler: CreateDepartmentHandler;
  let create: jest.Mock<(department: Department) => Promise<Department>>;
  let execute: jest.Mock<CommandBus['execute']>;

  beforeEach(async () => {
    create = jest.fn((department) => Promise.resolve(department));
    execute = jest.fn<CommandBus['execute']>().mockResolvedValue({
      id: 'audit-id',
    });

    const moduleRef = await Test.createTestingModule({
      providers: [
        {
          provide: DEPARTMENTS_REPOSITORY,
          useValue: {
            findPage: jest.fn(),
            findById: jest.fn(),
            create,
            update: jest.fn(),
          },
        },
        { provide: CommandBus, useValue: { execute } },
        {
          provide: UNIT_OF_WORK,
          useValue: {
            run: (work: () => Promise<unknown>) => work(),
          },
        },
        CreateDepartmentHandler,
      ],
    }).compile();

    handler = moduleRef.get(CreateDepartmentHandler);
  });

  it('creates a department and appends its audit event', async () => {
    const result = await handler.execute(
      new CreateDepartmentCommand('  Pharmacy  ', headers),
    );

    const created = create.mock.calls[0][0];

    expect(result.id).toBe(created.getId());
    expect(created.getName()).toBe('Pharmacy');
    expect(created.getDeletedAt()).toBeNull();

    expect(execute).toHaveBeenCalledTimes(1);

    const auditCommand = execute.mock.calls[0][0];

    expect(auditCommand).toBeInstanceOf(RecordAuditLogCommand);
    expect((auditCommand as RecordAuditLogCommand).props).toMatchObject({
      actorId: headers.actorId,
      action: 'create',
      entityType: EntityType.DEPARTMENTS,
      entityId: created.getId(),
      after: { name: 'Pharmacy' },
    });
  });

  it('does not save or emit an event for a blank name', async () => {
    await expect(
      handler.execute(new CreateDepartmentCommand('   ', headers)),
    ).rejects.toThrow(DepartmentNameRequiredException);

    expect(create).not.toHaveBeenCalled();
    expect(execute).not.toHaveBeenCalled();
  });
});
