import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  EntityManager,
  UniqueConstraintViolationException,
} from '@mikro-orm/core';
import { MikroEmployee } from '../../infrastructure/entities/mikro-employee.entity';
import { Employee } from '../../domain/employee.aggregate';
import { EmployeeStatus } from '../../domain/enums/employee-status.enum';
import {
  type EmployeePage,
  type FindEmployeesOptions,
  type IEmployeesRepository,
} from '../../domain/employees.repository';
import { EmployeeMapper } from '../mappers/employee.mapper';

@Injectable()
export class MikroEmployeesRepository implements IEmployeesRepository {
  public constructor(private readonly entityManager: EntityManager) {}

  public async findPage(options: FindEmployeesOptions): Promise<EmployeePage> {
    const [employees, total] = await this.entityManager.findAndCount(
      MikroEmployee,
      {},
      {
        orderBy: { createdAt: 'desc' },
        limit: options.limit,
        offset: options.offset,
      },
    );

    return {
      items: employees.map((employee) => EmployeeMapper.toDomain(employee)),
      total,
    };
  }

  public async findById(id: string): Promise<Employee | null> {
    const employee = await this.entityManager.findOne(MikroEmployee, { id });

    return employee ? EmployeeMapper.toDomain(employee) : null;
  }

  public async findStatusByUserId(
    userId: string,
  ): Promise<EmployeeStatus | null> {
    const employee = await this.entityManager.findOne(MikroEmployee, {
      userId,
    });

    return employee?.status ?? null;
  }

  public async create(employee: Employee): Promise<Employee> {
    const mikroEmployee = EmployeeMapper.toMikro(employee);

    try {
      this.entityManager.persist(mikroEmployee);
      await this.entityManager.flush();

      return EmployeeMapper.toDomain(mikroEmployee);
    } catch (error) {
      if (error instanceof UniqueConstraintViolationException) {
        throw new ConflictException('Employee user already exists');
      }

      throw error;
    }
  }

  public async update(employee: Employee): Promise<void> {
    const mikroEmployee = await this.entityManager.findOne(MikroEmployee, {
      id: employee.getId(),
    });

    if (!mikroEmployee) {
      throw new NotFoundException(`Employee id ${employee.getId()} not found`);
    }

    EmployeeMapper.assign(mikroEmployee, employee);
    await this.entityManager.flush();
  }
}
