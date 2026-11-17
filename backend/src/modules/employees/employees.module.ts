import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { SecurityModule } from '../../shared/modules/security/security.module';
import { MikroEmployee } from './infrastructure/entities/mikro-employee.entity';
import { EmployeesController } from './presentation/employees/employees.controller';

@Module({
  controllers: [EmployeesController],
  imports: [MikroOrmModule.forFeature([MikroEmployee]), SecurityModule],
})
export class EmployeesModule {}
