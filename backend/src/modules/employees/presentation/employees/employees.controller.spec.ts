import { jest } from '@jest/globals';
import { Test } from '@nestjs/testing';
import { CommandBus } from '@nestjs/cqrs';
import { AuthGuard } from '../../../../shared/modules/security/auth.guard';
import { PermissionsGuard } from '../../../../shared/modules/security/permissions.guard';
import { EmployeesController } from './employees.controller';
import { UpdateEmployeeStatusCommand } from '../../application/commands/update-employee-status/update-employee-status.command';
import { UpdateEmployeeStatusRequest } from './requests/update-employee-status.request';
import { EmployeeStatus } from '../../domain/enums/employee-status.enum';
import { type ActorHeaders } from '../../../../shared/types/actor-headers';

const EMPLOYEE_ID = '4e770b20-0ab6-494a-9bfd-e475e07c7a17';

const headers: ActorHeaders = {
  actorId: '7d0d2c55-9a9d-4c7d-9f6a-3f7f5a1b2c3d',
  actorType: 'user',
  actorLabel: 'admin@example.com',
  userIp: '127.0.0.1',
  userAgent: 'jest',
};

describe('EmployeesController', () => {
  let controller: EmployeesController;
  let execute: jest.Mock<
    (command: UpdateEmployeeStatusCommand) => Promise<{
      id: string;
      status: EmployeeStatus;
    }>
  >;

  beforeEach(async () => {
    execute = jest.fn(() =>
      Promise.resolve({ id: EMPLOYEE_ID, status: EmployeeStatus.RESIGNED }),
    );

    const module = await Test.createTestingModule({
      controllers: [EmployeesController],
      providers: [{ provide: CommandBus, useValue: { execute } }],
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

  it('dispatches UpdateEmployeeStatusCommand on status update', async () => {
    const request = new UpdateEmployeeStatusRequest();
    request.status = EmployeeStatus.RESIGNED;

    const response = await controller.updateStatus(
      EMPLOYEE_ID,
      request,
      headers,
    );

    expect(execute).toHaveBeenCalledWith(
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
});
