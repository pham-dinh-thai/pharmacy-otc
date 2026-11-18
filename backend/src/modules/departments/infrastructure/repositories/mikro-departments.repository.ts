import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  EntityManager,
  UniqueConstraintViolationException,
} from '@mikro-orm/core';
import {
  type DepartmentPage,
  type FindDepartmentsOptions,
  type IDepartmentsRepository,
} from '../../domain/departments.repository';
import { Department } from '../../domain/department.aggregate';
import { DepartmentMapper } from '../mappers/department.mapper';
import { MikroDepartment } from '../entities/mikro-department.entity';

@Injectable()
export class MikroDepartmentsRepository implements IDepartmentsRepository {
  public constructor(private readonly entityManager: EntityManager) {}

  public async findPage(
    options: FindDepartmentsOptions,
  ): Promise<DepartmentPage> {
    const [mikroDepartments, total] = await this.entityManager.findAndCount(
      MikroDepartment,
      {},
      {
        orderBy: { createdAt: 'desc' },
        limit: options.limit,
        offset: options.offset,
      },
    );

    return {
      items: mikroDepartments.map((mikroDepartment) =>
        DepartmentMapper.toDomain(mikroDepartment),
      ),
      total,
    };
  }

  public async findActive(): Promise<Department[]> {
    const mikroDepartments = await this.entityManager.findAll(MikroDepartment, {
      where: { deletedAt: null },
      orderBy: { name: 'asc' },
    });

    return mikroDepartments.map((mikroDepartment) =>
      DepartmentMapper.toDomain(mikroDepartment),
    );
  }

  public async findById(id: string): Promise<Department | null> {
    const mikroDepartment = await this.entityManager.findOne(MikroDepartment, {
      id,
    });

    return mikroDepartment ? DepartmentMapper.toDomain(mikroDepartment) : null;
  }

  public create(department: Department): Promise<Department> {
    return this.persistDepartment(new MikroDepartment(), department, true);
  }

  public async update(department: Department): Promise<Department> {
    const mikroDepartment = await this.entityManager.findOne(MikroDepartment, {
      id: department.getId(),
    });

    if (!mikroDepartment) {
      throw new NotFoundException(
        `Department id ${department.getId()} not found`,
      );
    }

    return this.persistDepartment(mikroDepartment, department, false);
  }

  private async persistDepartment(
    mikroDepartment: MikroDepartment,
    department: Department,
    insert: boolean,
  ): Promise<Department> {
    try {
      DepartmentMapper.assign(mikroDepartment, department);

      if (insert) {
        this.entityManager.persist(mikroDepartment);
      }

      await this.entityManager.flush();

      return DepartmentMapper.toDomain(mikroDepartment);
    } catch (error) {
      if (error instanceof UniqueConstraintViolationException) {
        throw new ConflictException('Department name already exists');
      }

      throw error;
    }
  }
}
