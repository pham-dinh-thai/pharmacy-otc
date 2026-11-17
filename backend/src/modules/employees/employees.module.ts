import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { SecurityModule } from '../../shared/modules/security/security.module';
import { OutBoxModule } from '../../shared/modules/outbox/outbox.module';
import { EMPLOYEES_REPOSITORY } from './domain/employees.repository';
import { GetEmploymentStatusHandler } from './application/queries/get-employment-status/get-employment-status.handler';
import { MikroEmployeesRepository } from './infrastructure/repositories/mikro-employees.repository';
import { MikroEmployee } from './infrastructure/entities/mikro-employee.entity';
import { EmployeesController } from './presentation/employees/employees.controller';
import { UpdateEmployeeStatusHandler } from './application/commands/update-employee-status/update-employee-status.handler';

@Module({
  controllers: [EmployeesController],
  imports: [
    MikroOrmModule.forFeature([MikroEmployee]),
    SecurityModule,
    OutBoxModule,
  ],
  providers: [
    { provide: EMPLOYEES_REPOSITORY, useClass: MikroEmployeesRepository },
    GetEmploymentStatusHandler,
    UpdateEmployeeStatusHandler,
  ],
  exports: [EMPLOYEES_REPOSITORY],
})
export class EmployeesModule {}
