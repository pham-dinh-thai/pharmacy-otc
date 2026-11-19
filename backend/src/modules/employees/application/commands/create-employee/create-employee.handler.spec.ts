import { jest } from '@jest/globals';
import { InvalidPasswordException } from '../../../../authentication/domain/exceptions/authentication.exceptions';
import { DepartmentDisabledException } from '../../../../departments/domain/exceptions/department.exceptions';
import { Test } from '@nestjs/testing';
import { CreateEmployeeHandler } from './create-employee.handler';
import { CreateEmployeeCommand } from './create-employee.command';
import { CreateUserService } from '../../../../users/application/services/create-user.service';
import { User } from '../../../../users/domain/user.aggregate';
import { ACCOUNTS_REPOSITORY } from '../../../../authentication/domain/accounts.repository';
import { Account } from '../../../../authentication/domain/account.aggregate';
import { EMPLOYEES_REPOSITORY } from '../../../domain/employees.repository';
import { Employee } from '../../../domain/employee.aggregate';
import {
  OUTBOX_REPOSITORY,
  type IOutboxRepository,
} from '../../../../../shared/modules/outbox/domain/outbox.repository';
import {
  UNIT_OF_WORK,
  type IUnitOfWork,
} from '../../../../../shared/modules/unit-of-work/unit-of-work';
import { AssignableDepartmentValidator } from '../../services/assignable-department.validator';
import { EntityType } from '../../../../audit-logs/domain/enums/entity-type.enum';
import { USER_CREATED_EVENT } from '../../../../users/domain/events/user-created.event';
import { ACCOUNT_SIGNED_UP_EVENT } from '../../../../authentication/domain/events/account-signed-up.event';
import { EMPLOYEE_CREATED_EVENT } from '../../../domain/events/employee-created.event';
import { EmployeeStatus } from '../../../domain/enums/employee-status.enum';

const headers = {
  actorId: '7d0d2c55-9a9d-4c7d-9f6a-3f7f5a1b2c3d',
  actorType: 'user',
  actorLabel: 'admin@example.com',
  userIp: '127.0.0.1',
  userAgent: 'jest',
};

const USER_ID = '1c2e9d5b-2c3a-4d6e-9f8a-0b1c2d3e4f50';
const DEPARTMENT_ID = 'b3d7f2a8-7a0e-4f1c-9c1a-4d3f5e6a7b8c';

const makeUser = (): User =>
  User.fromPersistent({
    id: USER_ID,
    firstName: 'Minh',
    lastName: 'Tran',
    email: 'minh@example.com',
    roleIds: [],
    createdAt: new Date('2026-11-17T00:00:00.000Z'),
    updatedAt: new Date('2026-11-17T00:00:00.000Z'),
  });

describe('CreateEmployeeHandler', () => {
  let handler: CreateEmployeeHandler;
  let createUser: jest.Mock<(input: unknown) => Promise<User>>;
  let createAccount: jest.Mock<(account: Account) => Account>;
  let createEmployee: jest.Mock<(employee: Employee) => Promise<Employee>>;
  let outboxCreate: jest.Mock<IOutboxRepository['create']>;
  let validateDepartment: jest.Mock<(id: string) => Promise<void>>;

  beforeEach(async () => {
    const user = makeUser();

    createUser = jest.fn(() => Promise.resolve(user));
    createAccount = jest.fn((account) => account);
    createEmployee = jest.fn((employee) => Promise.resolve(employee));
    outboxCreate = jest.fn<IOutboxRepository['create']>();
    validateDepartment = jest.fn(() => Promise.resolve());

    const moduleRef = await Test.createTestingModule({
      providers: [
        { provide: CreateUserService, useValue: { create: createUser } },
        {
          provide: ACCOUNTS_REPOSITORY,
          useValue: { create: createAccount, findByUserId: jest.fn() },
        },
        {
          provide: EMPLOYEES_REPOSITORY,
          useValue: {
            findPage: jest.fn(),
            findById: jest.fn(),
            findStatusByUserId: jest.fn(),
            create: createEmployee,
            update: jest.fn(),
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
        CreateEmployeeHandler,
      ],
    }).compile();

    handler = moduleRef.get(CreateEmployeeHandler);
  });

  const command = new CreateEmployeeCommand(
    'Minh',
    'Tran',
    'minh@example.com',
    'secret123',
    DEPARTMENT_ID,
    null,
    headers,
  );

  it('creates user, account and employee with audit events in one flow', async () => {
    const result = await handler.execute(command);

    expect(validateDepartment).toHaveBeenCalledWith(DEPARTMENT_ID);
    expect(createUser).toHaveBeenCalledWith({
      firstName: 'Minh',
      lastName: 'Tran',
      email: 'minh@example.com',
    });

    const account = createAccount.mock.calls[0][0];
    expect(account.getUserId()).toBe(USER_ID);
    expect(account.getIsActive()).toBe(true);
    expect(account.getMustChangePassword()).toBe(true);
    await expect(account.verify('secret123')).resolves.toBe(true);

    const employee = createEmployee.mock.calls[0][0];
    expect(result.id).toBe(employee.getId());
    expect(employee.getUserId()).toBe(USER_ID);
    expect(employee.getDepartmentId()).toBe(DEPARTMENT_ID);
    expect(employee.getPosition()).toBeNull();
    expect(employee.getStatus()).toBe(EmployeeStatus.WORKING);

    expect(outboxCreate).toHaveBeenCalledTimes(3);
    expect(outboxCreate).toHaveBeenNthCalledWith(1, {
      eventType: USER_CREATED_EVENT,
      payload: {
        headers,
        audit: {
          entityType: EntityType.USERS,
          entityId: USER_ID,
          after: {
            firstName: 'Minh',
            lastName: 'Tran',
            email: 'minh@example.com',
            roleIds: [],
          },
        },
      },
    });
    expect(outboxCreate.mock.calls[1][0].eventType).toBe(
      ACCOUNT_SIGNED_UP_EVENT,
    );
    expect(outboxCreate.mock.calls[2][0]).toMatchObject({
      eventType: EMPLOYEE_CREATED_EVENT,
      payload: {
        headers,
        audit: {
          entityType: EntityType.EMPLOYEES,
          entityId: employee.getId(),
        },
      },
    });
  });

  it('does not create anything when the department cannot be assigned', async () => {
    validateDepartment.mockRejectedValueOnce(new DepartmentDisabledException());

    await expect(handler.execute(command)).rejects.toThrow(
      DepartmentDisabledException,
    );

    expect(createUser).not.toHaveBeenCalled();
    expect(createAccount).not.toHaveBeenCalled();
    expect(createEmployee).not.toHaveBeenCalled();
    expect(outboxCreate).not.toHaveBeenCalled();
  });

  it('does not create an employee for an invalid password', async () => {
    await expect(
      handler.execute(
        new CreateEmployeeCommand(
          'Minh',
          'Tran',
          'minh@example.com',
          'short',
          DEPARTMENT_ID,
          null,
          headers,
        ),
      ),
    ).rejects.toThrow(InvalidPasswordException);

    expect(createEmployee).not.toHaveBeenCalled();
    expect(outboxCreate).not.toHaveBeenCalled();
  });
});
