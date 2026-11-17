import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { SecurityModule } from '../../shared/modules/security/security.module';
import { OutBoxModule } from '../../shared/modules/outbox/outbox.module';
import { UsersModule } from '../users/users.module';
import { AuthenticationModule } from '../authentication/authentication.module';
import { DepartmentsModule } from '../departments/departments.module';
import { EMPLOYEES_REPOSITORY } from './domain/employees.repository';
import { MikroEmployeesRepository } from './infrastructure/repositories/mikro-employees.repository';
import { MikroEmployee } from './infrastructure/entities/mikro-employee.entity';
import { EmployeesController } from './presentation/employees/employees.controller';
import { AssignableDepartmentValidator } from './application/services/assignable-department.validator';
import { EmployeeStatusTransitionService } from './application/services/employee-status-transition.service';
import { EmployeeReadModelFactory } from './application/queries/employee-read-model.factory';
import { CreateEmployeeHandler } from './application/commands/create-employee/create-employee.handler';
import { UpdateEmployeeHandler } from './application/commands/update-employee/update-employee.handler';
import { UpdateEmployeeStatusHandler } from './application/commands/update-employee-status/update-employee-status.handler';
import { GetEmployeesHandler } from './application/queries/get-employees/get-employees.handler';
import { GetEmployeeHandler } from './application/queries/get-employee/get-employee.handler';
import { GetEmployeeDepartmentsHandler } from './application/queries/get-employee-departments/get-employee-departments.handler';
import { GetEmploymentStatusHandler } from './application/queries/get-employment-status/get-employment-status.handler';

@Module({
  controllers: [EmployeesController],
  imports: [
    MikroOrmModule.forFeature([MikroEmployee]),
    SecurityModule,
    OutBoxModule,
    UsersModule,
    AuthenticationModule,
    DepartmentsModule,
  ],
  providers: [
    { provide: EMPLOYEES_REPOSITORY, useClass: MikroEmployeesRepository },
    AssignableDepartmentValidator,
    EmployeeStatusTransitionService,
    EmployeeReadModelFactory,
    CreateEmployeeHandler,
    UpdateEmployeeHandler,
    UpdateEmployeeStatusHandler,
    GetEmployeesHandler,
    GetEmployeeHandler,
    GetEmployeeDepartmentsHandler,
    GetEmploymentStatusHandler,
  ],
  exports: [EMPLOYEES_REPOSITORY],
})
export class EmployeesModule {}
