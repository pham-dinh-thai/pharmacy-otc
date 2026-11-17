import { jest } from '@jest/globals';
import { UnprocessableEntityException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { CreateDepartmentHandler } from './create-department.handler';
import { CreateDepartmentCommand } from './create-department.command';
import { DEPARTMENTS_REPOSITORY } from '../../../domain/departments.repository';
import { Department } from '../../../domain/department.aggregate';
import {
  OUTBOX_REPOSITORY,
  type IOutboxRepository,
} from '../../../../../shared/modules/outbox/domain/outbox.repository';
import { UNIT_OF_WORK } from '../../../../../shared/modules/unit-of-work/unit-of-work';
import { DEPARTMENT_CREATED_EVENT } from '../../../domain/events/department-created.event';
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
  let outboxCreate: jest.Mock<IOutboxRepository['create']>;

  beforeEach(async () => {
    create = jest.fn((department) => Promise.resolve(department));
    outboxCreate = jest.fn<IOutboxRepository['create']>();

    const moduleRef = await Test.createTestingModule({
      providers: [
        {
          provide: DEPARTMENTS_REPOSITORY,
          useValue: {
            findAll: jest.fn(),
            findById: jest.fn(),
            create,
            update: jest.fn(),
          },
        },
        { provide: OUTBOX_REPOSITORY, useValue: { create: outboxCreate } },
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
    expect(outboxCreate).toHaveBeenCalledWith({
      eventType: DEPARTMENT_CREATED_EVENT,
      payload: {
        headers,
        audit: {
          entityType: EntityType.DEPARTMENTS,
          entityId: created.getId(),
          after: { name: 'Pharmacy' },
        },
      },
    });
  });

  it('does not save or emit an event for a blank name', async () => {
    await expect(
      handler.execute(new CreateDepartmentCommand('   ', headers)),
    ).rejects.toThrow(UnprocessableEntityException);

    expect(create).not.toHaveBeenCalled();
    expect(outboxCreate).not.toHaveBeenCalled();
  });
});
