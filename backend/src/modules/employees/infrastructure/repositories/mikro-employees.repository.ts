import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  EntityManager,
  type FilterQuery,
  UniqueConstraintViolationException,
} from '@mikro-orm/core';
import { MikroUser } from '../../../users/infrastructure/entities/mikro-user.entity';
import { likePattern } from '../../../../shared/utils/list-filters';
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
    const where: FilterQuery<MikroEmployee> = {
      ...(options.departmentId ? { departmentId: options.departmentId } : {}),
      ...(options.position ? { position: options.position } : {}),
      ...(options.status ? { status: options.status } : {}),
    };

    const pattern = likePattern(options.search);

    if (pattern) {
      const users = await this.entityManager.find(
        MikroUser,
        {
          $or: [
            { firstName: { $ilike: pattern } },
            { lastName: { $ilike: pattern } },
            { email: { $ilike: pattern } },
          ],
        },
        { fields: ['id'] },
      );
      const userIds = users.map((user) => user.id);

      if (userIds.length === 0) return { items: [], total: 0 };

      where.userId = { $in: userIds };
    }

    const [employees, total] = await this.entityManager.findAndCount(
      MikroEmployee,
      where,
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
