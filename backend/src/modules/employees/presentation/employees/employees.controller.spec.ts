import { jest } from '@jest/globals';
import { Test } from '@nestjs/testing';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { AuthGuard } from '../../../../shared/modules/security/auth.guard';
import { PermissionsGuard } from '../../../../shared/modules/security/permissions.guard';
import { EmployeesController } from './employees.controller';
import { CreateEmployeeCommand } from '../../application/commands/create-employee/create-employee.command';
import { UpdateEmployeeCommand } from '../../application/commands/update-employee/update-employee.command';
import { UpdateEmployeeStatusCommand } from '../../application/commands/update-employee-status/update-employee-status.command';
import { GetEmployeesQuery } from '../../application/queries/get-employees/get-employees.query';
import { ListEmployeesRequest } from './requests/list-employees.request';
import { GetEmployeeQuery } from '../../application/queries/get-employee/get-employee.query';
import { GetEmployeeDepartmentsQuery } from '../../application/queries/get-employee-departments/get-employee-departments.query';
import { CreateEmployeeRequest } from './requests/create-employee.request';
import { UpdateEmployeeRequest } from './requests/update-employee.request';
import { UpdateEmployeeStatusRequest } from './requests/update-employee-status.request';
import { EmployeeStatus } from '../../domain/enums/employee-status.enum';
import { EmployeePosition } from '../../domain/enums/employee-position.enum';
import { type ActorHeaders } from '../../../../shared/types/actor-headers';

const EMPLOYEE_ID = '4e770b20-0ab6-494a-9bfd-e475e07c7a17';
const DEPARTMENT_ID = 'b3d7f2a8-7a0e-4f1c-9c1a-4d3f5e6a7b8c';

const headers: ActorHeaders = {
  actorId: '7d0d2c55-9a9d-4c7d-9f6a-3f7f5a1b2c3d',
  actorType: 'user',
  actorLabel: 'admin@example.com',
  userIp: '127.0.0.1',
  userAgent: 'jest',
};

describe('EmployeesController', () => {
  let controller: EmployeesController;
  let executeCommand: jest.Mock<(command: unknown) => Promise<unknown>>;
  let executeQuery: jest.Mock<(query: unknown) => Promise<unknown>>;

  beforeEach(async () => {
    executeCommand = jest.fn(() =>
      Promise.resolve({ id: EMPLOYEE_ID, status: EmployeeStatus.RESIGNED }),
    );
    executeQuery = jest.fn(() => Promise.resolve([]));

    const module = await Test.createTestingModule({
      controllers: [EmployeesController],
      providers: [
        { provide: CommandBus, useValue: { execute: executeCommand } },
        { provide: QueryBus, useValue: { execute: executeQuery } },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get(EmployeesController);
  });

  it('is defined with authentication and permission guards', () => {
    expect(controller).toBeDefined();
  });

  it('dispatches list, detail and department option queries', async () => {
    const listRequest = new ListEmployeesRequest();
    listRequest.page = 3;
    listRequest.limit = 10;
    listRequest.search = 'Nguyen';
    listRequest.status = EmployeeStatus.WORKING;

    await controller.findDepartments();
    await controller.findAll(listRequest);
    await controller.findOne(EMPLOYEE_ID);

    expect(executeQuery).toHaveBeenNthCalledWith(
      1,
      new GetEmployeeDepartmentsQuery(),
    );
    expect(executeQuery).toHaveBeenNthCalledWith(
      2,
      new GetEmployeesQuery({
        page: 3,
        limit: 10,
        search: 'Nguyen',
        status: EmployeeStatus.WORKING,
      }),
    );
    expect(executeQuery).toHaveBeenNthCalledWith(
      3,
      new GetEmployeeQuery(EMPLOYEE_ID),
    );
  });

  it('dispatches CreateEmployeeCommand on create', async () => {
    const request = new CreateEmployeeRequest();
    request.firstName = 'Minh';
    request.lastName = 'Tran';
    request.email = 'minh@example.com';
    request.password = 'secret123';
    request.departmentId = DEPARTMENT_ID;
    request.position = EmployeePosition.PHARMACIST;

    await controller.create(request, headers);

    expect(executeCommand).toHaveBeenCalledWith(
      new CreateEmployeeCommand(
        'Minh',
        'Tran',
        'minh@example.com',
        'secret123',
        DEPARTMENT_ID,
        EmployeePosition.PHARMACIST,
        headers,
      ),
    );
  });

  it('dispatches UpdateEmployeeCommand on update', async () => {
    const request = new UpdateEmployeeRequest();
    request.departmentId = DEPARTMENT_ID;
    request.position = null;
    request.status = EmployeeStatus.PREGNANT;

    await controller.update(EMPLOYEE_ID, request, headers);

    expect(executeCommand).toHaveBeenCalledWith(
      new UpdateEmployeeCommand(
        EMPLOYEE_ID,
        DEPARTMENT_ID,
        null,
        EmployeeStatus.PREGNANT,
        headers,
      ),
    );
  });

  it('dispatches UpdateEmployeeStatusCommand on status update', async () => {
    const request = new UpdateEmployeeStatusRequest();
    request.status = EmployeeStatus.RESIGNED;

    const response = await controller.updateStatus(
      EMPLOYEE_ID,
      request,
      headers,
    );

    expect(executeCommand).toHaveBeenCalledWith(
      new UpdateEmployeeStatusCommand(
        EMPLOYEE_ID,
        EmployeeStatus.RESIGNED,
        headers,
      ),
    );
    expect(response).toEqual({
      id: EMPLOYEE_ID,
      status: EmployeeStatus.RESIGNED,
    });
  });

  it('dispatches a resignation command on delete', async () => {
    await controller.resign(EMPLOYEE_ID, headers);

    expect(executeCommand).toHaveBeenCalledWith(
      new UpdateEmployeeStatusCommand(
        EMPLOYEE_ID,
        EmployeeStatus.RESIGNED,
        headers,
      ),
    );
  });
});
