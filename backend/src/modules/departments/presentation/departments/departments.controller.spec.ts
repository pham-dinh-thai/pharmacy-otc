import { jest } from '@jest/globals';
import { Test } from '@nestjs/testing';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { AuthGuard } from '../../../../shared/modules/security/auth.guard';
import { PermissionsGuard } from '../../../../shared/modules/security/permissions.guard';
import { DepartmentsController } from './departments.controller';
import { CreateDepartmentCommand } from '../../application/commands/create-department/create-department.command';
import { UpdateDepartmentCommand } from '../../application/commands/update-department/update-department.command';
import { SoftDeleteDepartmentCommand } from '../../application/commands/soft-delete-department/soft-delete-department.command';
import { RestoreDepartmentCommand } from '../../application/commands/restore-department/restore-department.command';
import { GetDepartmentsQuery } from '../../application/queries/get-departments/get-departments.query';
import { ListDepartmentsRequest } from './requests/list-departments.request';
import { GetDepartmentQuery } from '../../application/queries/get-department/get-department.query';
import { CreateDepartmentRequest } from './requests/create-department.request';
import { UpdateDepartmentRequest } from './requests/update-department.request';
import { type ActorHeaders } from '../../../../shared/types/actor-headers';

const DEPARTMENT_ID = '4e770b20-0ab6-494a-9bfd-e475e07c7a17';

const headers: ActorHeaders = {
  actorId: '7d0d2c55-9a9d-4c7d-9f6a-3f7f5a1b2c3d',
  actorType: 'user',
  actorLabel: 'admin@example.com',
  userIp: '127.0.0.1',
  userAgent: 'jest',
};

describe('DepartmentsController', () => {
  let controller: DepartmentsController;
  let executeCommand: jest.Mock<(command: unknown) => Promise<unknown>>;
  let executeQuery: jest.Mock<(query: unknown) => Promise<unknown>>;

  beforeEach(async () => {
    executeCommand = jest.fn(() => Promise.resolve({ id: DEPARTMENT_ID }));
    executeQuery = jest.fn(() => Promise.resolve([]));

    const module = await Test.createTestingModule({
      controllers: [DepartmentsController],
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

    controller = module.get(DepartmentsController);
  });

  it('is defined with authentication and permission guards', () => {
    expect(controller).toBeDefined();
  });

  it('dispatches list and detail queries', async () => {
    const listRequest = new ListDepartmentsRequest();
    listRequest.page = 3;
    listRequest.limit = 10;

    await controller.findAll(listRequest);
    await controller.findOne(DEPARTMENT_ID);

    expect(executeQuery).toHaveBeenNthCalledWith(
      1,
      new GetDepartmentsQuery(3, 10),
    );
    expect(executeQuery).toHaveBeenNthCalledWith(
      2,
      new GetDepartmentQuery(DEPARTMENT_ID),
    );
  });

  it('dispatches create, update, soft-delete and restore commands', async () => {
    const createRequest = new CreateDepartmentRequest();
    createRequest.name = 'Pharmacy';
    const updateRequest = new UpdateDepartmentRequest();
    updateRequest.name = 'Retail Pharmacy';

    await controller.create(createRequest, headers);
    await controller.update(DEPARTMENT_ID, updateRequest, headers);
    await controller.softDelete(DEPARTMENT_ID, headers);
    await controller.restore(DEPARTMENT_ID, headers);

    expect(executeCommand).toHaveBeenNthCalledWith(
      1,
      new CreateDepartmentCommand('Pharmacy', headers),
    );
    expect(executeCommand).toHaveBeenNthCalledWith(
      2,
      new UpdateDepartmentCommand(DEPARTMENT_ID, 'Retail Pharmacy', headers),
    );
    expect(executeCommand).toHaveBeenNthCalledWith(
      3,
      new SoftDeleteDepartmentCommand(DEPARTMENT_ID, headers),
    );
    expect(executeCommand).toHaveBeenNthCalledWith(
      4,
      new RestoreDepartmentCommand(DEPARTMENT_ID, headers),
    );
  });
});
