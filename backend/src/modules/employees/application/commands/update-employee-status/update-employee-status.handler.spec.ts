import { jest } from '@jest/globals';
import { EmployeeNotFoundException } from '../../../domain/exceptions/employee.exceptions';
import { CommandBus } from '@nestjs/cqrs';
import { Test } from '@nestjs/testing';
import { UpdateEmployeeStatusHandler } from './update-employee-status.handler';
import { UpdateEmployeeStatusCommand } from './update-employee-status.command';
import {
  type IEmployeesRepository,
  EMPLOYEES_REPOSITORY,
} from '../../../domain/employees.repository';
import { Employee } from '../../../domain/employee.aggregate';
import { EmployeeStatus } from '../../../domain/enums/employee-status.enum';
import { EmployeePosition } from '../../../domain/enums/employee-position.enum';
import {
  type IUnitOfWork,
  UNIT_OF_WORK,
} from '../../../../../shared/modules/unit-of-work/unit-of-work';
import { RecordAuditLogCommand } from '../../../../audit-logs/application/commands/record-audit-log/record-audit-log.command';
import { DeactivateUserCommand } from '../../../../users/application/commands/deactivate-user/deactivate-user.command';
import { EntityType } from '../../../../audit-logs/domain/enums/entity-type.enum';
import { EmployeeStatusTransitionService } from '../../services/employee-status-transition.service';

const headers = {
  actorId: '7d0d2c55-9a9d-4c7d-9f6a-3f7f5a1b2c3d',
  actorType: 'user',
  actorLabel: 'admin@example.com',
  userIp: '127.0.0.1',
  userAgent: 'jest',
};

const EMPLOYEE_ID = '4e770b20-0ab6-494a-9bfd-e475e07c7a17';
const USER_ID = '1c2e9d5b-2c3a-4d6e-9f8a-0b1c2d3e4f50';

const employeeWithStatus = (status: EmployeeStatus): Employee =>
  Employee.fromPersistent({
    id: EMPLOYEE_ID,
    userId: USER_ID,
    departmentId: 'b3d7f2a8-7a0e-4f1c-9c1a-4d3f5e6a7b8c',
    position: EmployeePosition.PHARMACIST,
    status,
    createdAt: new Date('2026-11-17T00:00:00.000Z'),
    updatedAt: new Date('2026-11-17T00:00:00.000Z'),
  });

describe('UpdateEmployeeStatusHandler', () => {
  let handler: UpdateEmployeeStatusHandler;
  let employeesRepository: jest.Mocked<
    Pick<IEmployeesRepository, 'findById' | 'update'>
  >;
  let commandBus: jest.Mocked<Pick<CommandBus, 'execute'>>;
  let unitOfWork: jest.Mocked<IUnitOfWork>;

  beforeEach(async () => {
    employeesRepository = {
      findById: jest.fn(),
      update: jest.fn(),
    } as unknown as jest.Mocked<
      Pick<IEmployeesRepository, 'findById' | 'update'>
    >;
    commandBus = {
      execute: jest.fn(),
    } as unknown as jest.Mocked<Pick<CommandBus, 'execute'>>;
    unitOfWork = {
      run: jest.fn(async (callback: () => Promise<unknown>) => callback()),
    } as unknown as jest.Mocked<IUnitOfWork>;

    const moduleRef = await Test.createTestingModule({
      providers: [
        { provide: EMPLOYEES_REPOSITORY, useValue: employeesRepository },
        { provide: CommandBus, useValue: commandBus },
        { provide: UNIT_OF_WORK, useValue: unitOfWork },
        EmployeeStatusTransitionService,
        UpdateEmployeeStatusHandler,
      ],
    }).compile();

    handler = moduleRef.get(UpdateEmployeeStatusHandler);
  });

  it('throws NotFoundException when employee does not exist', async () => {
    employeesRepository.findById.mockResolvedValue(null);

    await expect(
      handler.execute(
        new UpdateEmployeeStatusCommand(
          EMPLOYEE_ID,
          EmployeeStatus.RESIGNED,
          headers,
        ),
      ),
    ).rejects.toThrow(EmployeeNotFoundException);

    expect(employeesRepository.update).not.toHaveBeenCalled();
    expect(commandBus.execute).not.toHaveBeenCalled();
  });

  it('does nothing when the status is unchanged', async () => {
    const employee = employeeWithStatus(EmployeeStatus.RESIGNED);
    employeesRepository.findById.mockResolvedValue(employee);

    await handler.execute(
      new UpdateEmployeeStatusCommand(
        EMPLOYEE_ID,
        EmployeeStatus.RESIGNED,
        headers,
      ),
    );

    expect(employeesRepository.update).not.toHaveBeenCalled();
    expect(commandBus.execute).not.toHaveBeenCalled();
  });

  it('records audit and deactivation commands when employee resigns', async () => {
    const employee = employeeWithStatus(EmployeeStatus.WORKING);
    employeesRepository.findById.mockResolvedValue(employee);

    const result = await handler.execute(
      new UpdateEmployeeStatusCommand(
        EMPLOYEE_ID,
        EmployeeStatus.RESIGNED,
        headers,
      ),
    );

    expect(employee.getStatus()).toBe(EmployeeStatus.RESIGNED);
    expect(employeesRepository.update).toHaveBeenCalledWith(employee);
    expect(commandBus.execute).toHaveBeenCalledTimes(2);
    const [auditCommand, deactivateCommand] = commandBus.execute.mock.calls.map(
      ([issuedCommand]) => issuedCommand,
    );

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
      before: { status: EmployeeStatus.WORKING },
      after: { status: EmployeeStatus.RESIGNED },
    });
    expect(deactivateCommand).toBeInstanceOf(DeactivateUserCommand);
    expect(deactivateCommand).toMatchObject({
      userId: USER_ID,
      headers,
    });
    expect(result).toEqual({
      id: EMPLOYEE_ID,
      status: EmployeeStatus.RESIGNED,
    });
  });

  it('records only the audit log for non-resignation statuses', async () => {
    const employee = employeeWithStatus(EmployeeStatus.WORKING);
    employeesRepository.findById.mockResolvedValue(employee);

    await handler.execute(
      new UpdateEmployeeStatusCommand(
        EMPLOYEE_ID,
        EmployeeStatus.PREGNANT,
        headers,
      ),
    );

    expect(employee.getStatus()).toBe(EmployeeStatus.PREGNANT);
    expect(commandBus.execute).toHaveBeenCalledTimes(1);
    const auditCommand = commandBus.execute.mock.calls[0][0];

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
      before: { status: EmployeeStatus.WORKING },
      after: { status: EmployeeStatus.PREGNANT },
    });
  });
});
