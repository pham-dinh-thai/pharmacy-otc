import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { SecurityModule } from '../../shared/modules/security/security.module';
import { MikroDepartment } from './infrastructure/entities/mikro-department.entity';
import { DepartmentsController } from './presentation/departments/departments.controller';

@Module({
  controllers: [DepartmentsController],
  imports: [MikroOrmModule.forFeature([MikroDepartment]), SecurityModule],
})
export class DepartmentsModule {}
