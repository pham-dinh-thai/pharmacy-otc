import { jest } from '@jest/globals';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { UpdateEmployeeHandler } from './update-employee.handler';
import { UpdateEmployeeCommand } from './update-employee.command';
import { EMPLOYEES_REPOSITORY } from '../../../domain/employees.repository';
import { Employee } from '../../../domain/employee.aggregate';
import { EmployeeStatus } from '../../../domain/enums/employee-status.enum';
import {
  OUTBOX_REPOSITORY,
  type IOutboxRepository,
} from '../../../../../shared/modules/outbox/domain/outbox.repository';
import {
  UNIT_OF_WORK,
  type IUnitOfWork,
} from '../../../../../shared/modules/unit-of-work/unit-of-work';
import { AssignableDepartmentValidator } from '../../services/assignable-department.validator';
import { EmployeeStatusTransitionService } from '../../services/employee-status-transition.service';
import { EMPLOYEE_UPDATED_EVENT } from '../../../domain/events/employee-updated.event';
import { EMPLOYEE_STATUS_CHANGED_EVENT } from '../../../domain/events/employee-status-changed.event';
import { EMPLOYEE_RESIGNED_EVENT } from '../../../domain/events/employee-resigned.event';
import { EntityType } from '../../../../audit-logs/domain/enums/entity-type.enum';

const headers = {
  actorId: '7d0d2c55-9a9d-4c7d-9f6a-3f7f5a1b2c3d',
  actorType: 'user',
  actorLabel: 'admin@example.com',
  userIp: '127.0.0.1',
  userAgent: 'jest',
};

const EMPLOYEE_ID = '4e770b20-0ab6-494a-9bfd-e475e07c7a17';
const USER_ID = '1c2e9d5b-2c3a-4d6e-9f8a-0b1c2d3e4f50';
const DEPARTMENT_ID = 'b3d7f2a8-7a0e-4f1c-9c1a-4d3f5e6a7b8c';
const NEXT_DEPARTMENT_ID = '2f8d9c30-1a2b-4c3d-8e4f-5a6b7c8d9e0f';

const employeeWithStatus = (status: EmployeeStatus): Employee =>
  Employee.fromPersistent({
    id: EMPLOYEE_ID,
    userId: USER_ID,
    departmentId: DEPARTMENT_ID,
    position: 'Pharmacist',
    status,
    createdAt: new Date('2026-11-17T00:00:00.000Z'),
    updatedAt: new Date('2026-11-17T00:00:00.000Z'),
  });

describe('UpdateEmployeeHandler', () => {
  let handler: UpdateEmployeeHandler;
  let findById: jest.Mock<(id: string) => Promise<Employee | null>>;
  let update: jest.Mock<(employee: Employee) => Promise<void>>;
  let outboxCreate: jest.Mock<IOutboxRepository['create']>;
  let validateDepartment: jest.Mock<(id: string) => Promise<void>>;

  beforeEach(async () => {
    findById = jest.fn(() =>
      Promise.resolve(employeeWithStatus(EmployeeStatus.WORKING)),
    );
    update = jest.fn(() => Promise.resolve());
    outboxCreate = jest.fn<IOutboxRepository['create']>();
    validateDepartment = jest.fn(() => Promise.resolve());

    const moduleRef = await Test.createTestingModule({
      providers: [
        {
          provide: EMPLOYEES_REPOSITORY,
          useValue: {
            findAll: jest.fn(),
            findById,
            findStatusByUserId: jest.fn(),
            create: jest.fn(),
            update,
          },
        },
        { provide: OUTBOX_REPOSITORY, useValue: { create: outboxCreate } },
        {
          provide: UNIT_OF_WORK,
          useValue: {
            run: (work: () => Promise<unknown>) => work(),
          } as IUnitOfWork,
        },
        {
          provide: AssignableDepartmentValidator,
          useValue: { validate: validateDepartment },
        },
        EmployeeStatusTransitionService,
        UpdateEmployeeHandler,
      ],
    }).compile();

    handler = moduleRef.get(UpdateEmployeeHandler);
  });

  it('throws NotFoundException when the employee does not exist', async () => {
    findById.mockResolvedValueOnce(null);

    await expect(
      handler.execute(
        new UpdateEmployeeCommand(
          EMPLOYEE_ID,
          DEPARTMENT_ID,
          null,
          undefined,
          headers,
        ),
      ),
    ).rejects.toThrow(NotFoundException);

    expect(update).not.toHaveBeenCalled();
    expect(outboxCreate).not.toHaveBeenCalled();
  });

  it('updates assignment and appends an employee.updated audit event', async () => {
    const result = await handler.execute(
      new UpdateEmployeeCommand(
        EMPLOYEE_ID,
        NEXT_DEPARTMENT_ID,
        '  Store Manager  ',
        undefined,
        headers,
      ),
    );

    expect(validateDepartment).toHaveBeenCalledWith(NEXT_DEPARTMENT_ID);
    expect(update).toHaveBeenCalledTimes(1);
    expect(outboxCreate).toHaveBeenCalledTimes(1);
    expect(outboxCreate).toHaveBeenCalledWith({
      eventType: EMPLOYEE_UPDATED_EVENT,
      payload: {
        headers,
        audit: {
          entityType: EntityType.EMPLOYEES,
          entityId: EMPLOYEE_ID,
          before: { departmentId: DEPARTMENT_ID, position: 'Pharmacist' },
          after: {
            departmentId: NEXT_DEPARTMENT_ID,
            position: 'Store Manager',
          },
        },
      },
    });
    expect(result).toMatchObject({
      id: EMPLOYEE_ID,
      departmentId: NEXT_DEPARTMENT_ID,
      position: 'Store Manager',
      status: EmployeeStatus.WORKING,
    });
  });

  it('uses the shared status transition for resignation', async () => {
    const result = await handler.execute(
      new UpdateEmployeeCommand(
        EMPLOYEE_ID,
        DEPARTMENT_ID,
        undefined,
        EmployeeStatus.RESIGNED,
        headers,
      ),
    );

    expect(update).toHaveBeenCalledTimes(1);
    expect(outboxCreate).toHaveBeenCalledTimes(2);
    expect(outboxCreate).toHaveBeenNthCalledWith(1, {
      eventType: EMPLOYEE_STATUS_CHANGED_EVENT,
      payload: {
        headers,
        audit: {
          entityType: EntityType.EMPLOYEES,
          entityId: EMPLOYEE_ID,
          before: { status: EmployeeStatus.WORKING },
          after: { status: EmployeeStatus.RESIGNED },
        },
      },
    });
    expect(outboxCreate).toHaveBeenNthCalledWith(2, {
      eventType: EMPLOYEE_RESIGNED_EVENT,
      payload: { employeeId: EMPLOYEE_ID, userId: USER_ID, headers },
    });
    expect(result.status).toBe(EmployeeStatus.RESIGNED);
  });

  it('keeps the current position when it is omitted', async () => {
    const result = await handler.execute(
      new UpdateEmployeeCommand(
        EMPLOYEE_ID,
        DEPARTMENT_ID,
        undefined,
        undefined,
        headers,
      ),
    );

    expect(result.position).toBe('Pharmacist');
    expect(update).not.toHaveBeenCalled();
    expect(outboxCreate).not.toHaveBeenCalled();
  });

  it('rejects a disabled department without changing the employee', async () => {
    validateDepartment.mockRejectedValueOnce(
      new ConflictException('Department is disabled'),
    );

    await expect(
      handler.execute(
        new UpdateEmployeeCommand(
          EMPLOYEE_ID,
          DEPARTMENT_ID,
          'Pharmacist',
          undefined,
          headers,
        ),
      ),
    ).rejects.toThrow(ConflictException);

    expect(update).not.toHaveBeenCalled();
    expect(outboxCreate).not.toHaveBeenCalled();
  });
});
