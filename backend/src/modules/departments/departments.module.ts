import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { SecurityModule } from '../../shared/modules/security/security.module';
import { OutBoxModule } from '../../shared/modules/outbox/outbox.module';
import { DEPARTMENTS_REPOSITORY } from './domain/departments.repository';
import { MikroDepartmentsRepository } from './infrastructure/repositories/mikro-departments.repository';
import { MikroDepartment } from './infrastructure/entities/mikro-department.entity';
import { DepartmentsController } from './presentation/departments/departments.controller';
import { CreateDepartmentHandler } from './application/commands/create-department/create-department.handler';
import { UpdateDepartmentHandler } from './application/commands/update-department/update-department.handler';
import { SoftDeleteDepartmentHandler } from './application/commands/soft-delete-department/soft-delete-department.handler';
import { RestoreDepartmentHandler } from './application/commands/restore-department/restore-department.handler';
import { GetDepartmentsHandler } from './application/queries/get-departments/get-departments.handler';
import { GetDepartmentHandler } from './application/queries/get-department/get-department.handler';

@Module({
  controllers: [DepartmentsController],
  imports: [
    MikroOrmModule.forFeature([MikroDepartment]),
    SecurityModule,
    OutBoxModule,
  ],
  providers: [
    { provide: DEPARTMENTS_REPOSITORY, useClass: MikroDepartmentsRepository },
    CreateDepartmentHandler,
    UpdateDepartmentHandler,
    SoftDeleteDepartmentHandler,
    RestoreDepartmentHandler,
    GetDepartmentsHandler,
    GetDepartmentHandler,
  ],
  exports: [DEPARTMENTS_REPOSITORY],
})
export class DepartmentsModule {}
