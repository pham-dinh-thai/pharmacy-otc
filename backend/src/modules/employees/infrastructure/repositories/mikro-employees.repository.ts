import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository } from '@mikro-orm/postgresql';
import { MikroEmployee } from '../../infrastructure/entities/mikro-employee.entity';
import { Employee } from '../../domain/employee.aggregate';
import { EmployeeStatus } from '../../domain/enums/employee-status.enum';
import { type IEmployeesRepository } from '../../domain/employees.repository';
import { EmployeeMapper } from '../mappers/employee.mapper';

@Injectable()
export class MikroEmployeesRepository implements IEmployeesRepository {
  public constructor(
    @InjectRepository(MikroEmployee)
    private readonly employees: EntityRepository<MikroEmployee>,
  ) {}

  public async findById(id: string): Promise<Employee | null> {
    const employee = await this.employees.findOne({ id });

    return employee ? EmployeeMapper.toDomain(employee) : null;
  }

  public async findStatusByUserId(
    userId: string,
  ): Promise<EmployeeStatus | null> {
    const employee = await this.employees.findOne({ userId });

    return employee?.status ?? null;
  }

  public async update(employee: Employee): Promise<void> {
    const mikroEmployee = await this.employees.findOne({
      id: employee.getId(),
    });

    if (!mikroEmployee) {
      throw new NotFoundException(`Employee id ${employee.getId()} not found`);
    }

    this.employees.assign(mikroEmployee, {
      status: employee.getStatus(),
      updatedAt: employee.getUpdatedAt(),
    });
  }
}
