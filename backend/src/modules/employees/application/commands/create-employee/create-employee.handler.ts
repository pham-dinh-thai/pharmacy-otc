import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateEmployeeCommand } from './create-employee.command';
import { CreateUserService } from '../../../../users/application/services/create-user.service';
import {
  ACCOUNTS_REPOSITORY,
  type IAccountsRepository,
} from '../../../../authentication/domain/accounts.repository';
import { Account } from '../../../../authentication/domain/account.aggregate';
import { Employee } from '../../../domain/employee.aggregate';
import {
  EMPLOYEES_REPOSITORY,
  type IEmployeesRepository,
} from '../../../domain/employees.repository';
import {
  type IOutboxRepository,
  OUTBOX_REPOSITORY,
} from '../../../../../shared/modules/outbox/domain/outbox.repository';
import {
  type IUnitOfWork,
  UNIT_OF_WORK,
} from '../../../../../shared/modules/unit-of-work/unit-of-work';
import { USER_CREATED_EVENT } from '../../../../users/domain/events/user-created.event';
import { ACCOUNT_SIGNED_UP_EVENT } from '../../../../authentication/domain/events/account-signed-up.event';
import { EMPLOYEE_CREATED_EVENT } from '../../../domain/events/employee-created.event';
import { auditEventPayload } from '../../../../audit-logs/domain/events/audit-event.payload';
import { EntityType } from '../../../../audit-logs/domain/enums/entity-type.enum';
import { AssignableDepartmentValidator } from '../../services/assignable-department.validator';

@CommandHandler(CreateEmployeeCommand)
export class CreateEmployeeHandler implements ICommandHandler<CreateEmployeeCommand> {
  public constructor(
    private readonly createUserService: CreateUserService,

    @Inject(ACCOUNTS_REPOSITORY)
    private readonly accountsRepository: IAccountsRepository,

    @Inject(EMPLOYEES_REPOSITORY)
    private readonly employeesRepository: IEmployeesRepository,

    @Inject(OUTBOX_REPOSITORY)
    private readonly outboxRepository: IOutboxRepository,

    @Inject(UNIT_OF_WORK)
    private readonly unitOfWork: IUnitOfWork,

    private readonly departmentValidator: AssignableDepartmentValidator,
  ) {}

  public async execute(
    command: CreateEmployeeCommand,
  ): Promise<{ id: string }> {
    return this.unitOfWork.run(async () => {
      await this.departmentValidator.validate(command.departmentId);

      const user = await this.createUserService.create({
        firstName: command.firstName,
        lastName: command.lastName,
        email: command.email,
      });

      const account = await Account.create({
        userId: user.getId(),
        password: command.password,
        // Admin tạo tài khoản cho nhân viên: tự ép đổi mật khẩu lần đầu.
        mustChangePassword: true,
      });
      this.accountsRepository.create(account);

      const employee = Employee.create({
        userId: user.getId(),
        departmentId: command.departmentId,
        position: command.position,
      });
      await this.employeesRepository.create(employee);

      await this.outboxRepository.create({
        eventType: USER_CREATED_EVENT,
        payload: auditEventPayload(command.headers, {
          entityType: EntityType.USERS,
          entityId: user.getId(),
          after: {
            firstName: user.getFirstName(),
            lastName: user.getLastName(),
            email: user.getEmail(),
            roleIds: user.getRoleIds(),
          },
        }),
      });

      await this.outboxRepository.create({
        eventType: ACCOUNT_SIGNED_UP_EVENT,
        payload: auditEventPayload(command.headers, {
          entityType: EntityType.ACCOUNTS,
          entityId: account.getId(),
          after: {
            accountId: account.getId(),
            userId: account.getUserId(),
          },
        }),
      });

      await this.outboxRepository.create({
        eventType: EMPLOYEE_CREATED_EVENT,
        payload: auditEventPayload(command.headers, {
          entityType: EntityType.EMPLOYEES,
          entityId: employee.getId(),
          after: {
            userId: employee.getUserId(),
            departmentId: employee.getDepartmentId(),
            position: employee.getPosition(),
            status: employee.getStatus(),
          },
        }),
      });

      return { id: employee.getId() };
    });
  }
}
