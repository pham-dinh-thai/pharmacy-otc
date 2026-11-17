import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Employee } from '../../domain/employee.aggregate';
import { EmployeeReadModel } from './employee.read-model';
import {
  USERS_REPOSITORY,
  type IUsersRepository,
} from '../../../users/domain/users.repository';
import {
  DEPARTMENTS_REPOSITORY,
  type IDepartmentsRepository,
} from '../../../departments/domain/departments.repository';
import {
  ACCOUNTS_REPOSITORY,
  type IAccountsRepository,
} from '../../../authentication/domain/accounts.repository';

@Injectable()
export class EmployeeReadModelFactory {
  public constructor(
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: IUsersRepository,

    @Inject(DEPARTMENTS_REPOSITORY)
    private readonly departmentsRepository: IDepartmentsRepository,

    @Inject(ACCOUNTS_REPOSITORY)
    private readonly accountsRepository: IAccountsRepository,
  ) {}

  public async create(employee: Employee): Promise<EmployeeReadModel> {
    const [user, department, account] = await Promise.all([
      this.usersRepository.findById(employee.getUserId()),
      this.departmentsRepository.findById(employee.getDepartmentId()),
      this.accountsRepository.findByUserId(employee.getUserId()),
    ]);

    if (!user) {
      throw new NotFoundException(
        `User id ${employee.getUserId()} for employee ${employee.getId()} not found`,
      );
    }

    if (!department) {
      throw new NotFoundException(
        `Department id ${employee.getDepartmentId()} for employee ${employee.getId()} not found`,
      );
    }

    if (!account) {
      throw new NotFoundException(
        `Account for user id ${employee.getUserId()} not found`,
      );
    }

    return new EmployeeReadModel(
      employee.getId(),
      employee.getUserId(),
      user.getFirstName(),
      user.getLastName(),
      user.getEmail(),
      employee.getDepartmentId(),
      department.getName(),
      employee.getPosition(),
      employee.getStatus(),
      account.getIsActive(),
      employee.getCreatedAt(),
      employee.getUpdatedAt(),
    );
  }
}
