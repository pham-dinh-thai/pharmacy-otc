import { jest } from '@jest/globals';
import { EmployeeNotFoundException } from '../../../domain/exceptions/employee.exceptions';
import { DepartmentDisabledException } from '../../../../departments/domain/exceptions/department.exceptions';
import { CommandBus } from '@nestjs/cqrs';
import { Test } from '@nestjs/testing';
import { UpdateEmployeeHandler } from './update-employee.handler';
import { UpdateEmployeeCommand } from './update-employee.command';
import { EMPLOYEES_REPOSITORY } from '../../../domain/employees.repository';
import { Employee } from '../../../domain/employee.aggregate';
import { EmployeeStatus } from '../../../domain/enums/employee-status.enum';
import { EmployeePosition } from '../../../domain/enums/employee-position.enum';
import {
  UNIT_OF_WORK,
  type IUnitOfWork,
} from '../../../../../shared/modules/unit-of-work/unit-of-work';
import { AssignableDepartmentValidator } from '../../services/assignable-department.validator';
import { EmployeeStatusTransitionService } from '../../services/employee-status-transition.service';
import { RecordAuditLogCommand } from '../../../../audit-logs/application/commands/record-audit-log/record-audit-log.command';
import { DeactivateUserCommand } from '../../../../users/application/commands/deactivate-user/deactivate-user.command';
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
    position: EmployeePosition.PHARMACIST,
    status,
    createdAt: new Date('2026-11-17T00:00:00.000Z'),
    updatedAt: new Date('2026-11-17T00:00:00.000Z'),
  });

describe('UpdateEmployeeHandler', () => {
  let handler: UpdateEmployeeHandler;
  let findById: jest.Mock<(id: string) => Promise<Employee | null>>;
  let update: jest.Mock<(employee: Employee) => Promise<void>>;
  let execute: jest.Mock<(command: unknown) => Promise<unknown>>;
  let validateDepartment: jest.Mock<(id: string) => Promise<void>>;

  beforeEach(async () => {
    findById = jest.fn(() =>
      Promise.resolve(employeeWithStatus(EmployeeStatus.WORKING)),
    );
    update = jest.fn(() => Promise.resolve());
    execute = jest.fn(() => Promise.resolve({ id: 'audit-id' }));
    validateDepartment = jest.fn(() => Promise.resolve());

    const moduleRef = await Test.createTestingModule({
      providers: [
        {
          provide: EMPLOYEES_REPOSITORY,
          useValue: {
            findPage: jest.fn(),
            findById,
            findStatusByUserId: jest.fn(),
            create: jest.fn(),
            update,
          },
        },
        { provide: CommandBus, useValue: { execute } },
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
    ).rejects.toThrow(EmployeeNotFoundException);

    expect(update).not.toHaveBeenCalled();
    expect(execute).not.toHaveBeenCalled();
  });

  it('updates assignment and records an employee update audit log', async () => {
    const result = await handler.execute(
      new UpdateEmployeeCommand(
        EMPLOYEE_ID,
        NEXT_DEPARTMENT_ID,
        EmployeePosition.MANAGER,
        undefined,
        headers,
      ),
    );

    expect(validateDepartment).toHaveBeenCalledWith(NEXT_DEPARTMENT_ID);
    expect(update).toHaveBeenCalledTimes(1);
    expect(execute).toHaveBeenCalledTimes(1);
    const auditCommand = execute.mock.calls[0][0];

    expect(auditCommand).toBeInstanceOf(RecordAuditLogCommand);
    expect((auditCommand as RecordAuditLogCommand).props).toMatchObject({
      actorId: headers.actorId,
      actorType: 'user',
      actorLabel: headers.actorLabel,
      ipAddress: headers.userIp,
      userAgent: headers.userAgent,
      action: 'update',
      entityType: EntityType.EMPLOYEES,
      entityId: EMPLOYEE_ID,
      before: {
        departmentId: DEPARTMENT_ID,
        position: EmployeePosition.PHARMACIST,
      },
      after: {
        departmentId: NEXT_DEPARTMENT_ID,
        position: EmployeePosition.MANAGER,
      },
    });
    expect(result).toMatchObject({
      id: EMPLOYEE_ID,
      departmentId: NEXT_DEPARTMENT_ID,
      position: EmployeePosition.MANAGER,
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
    expect(execute).toHaveBeenCalledTimes(2);
    const [statusCommand, deactivateCommand] = execute.mock.calls.map(
      ([issuedCommand]) => issuedCommand,
    );

    expect(statusCommand).toBeInstanceOf(RecordAuditLogCommand);
    expect((statusCommand as RecordAuditLogCommand).props).toMatchObject({
      action: 'update',
      entityType: EntityType.EMPLOYEES,
      entityId: EMPLOYEE_ID,
      before: { status: EmployeeStatus.WORKING },
      after: { status: EmployeeStatus.RESIGNED },
    });
    expect(deactivateCommand).toBeInstanceOf(DeactivateUserCommand);
    expect(deactivateCommand).toMatchObject({
      userId: USER_ID,
      headers,
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

    expect(result.position).toBe(EmployeePosition.PHARMACIST);
    expect(update).not.toHaveBeenCalled();
    expect(execute).not.toHaveBeenCalled();
  });

  it('rejects a disabled department without changing the employee', async () => {
    validateDepartment.mockRejectedValueOnce(new DepartmentDisabledException());

    await expect(
      handler.execute(
        new UpdateEmployeeCommand(
          EMPLOYEE_ID,
          DEPARTMENT_ID,
          EmployeePosition.PHARMACIST,
          undefined,
          headers,
        ),
      ),
    ).rejects.toThrow(DepartmentDisabledException);

    expect(update).not.toHaveBeenCalled();
    expect(execute).not.toHaveBeenCalled();
  });
});
