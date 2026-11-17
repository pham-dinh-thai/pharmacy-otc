import { Inject, NotFoundException } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
  DEPARTMENTS_REPOSITORY,
  type IDepartmentsRepository,
} from '../../../domain/departments.repository';
import { DepartmentListItemReadModel } from '../get-departments/department-list-item.read-model';
import { GetDepartmentQuery } from './get-department.query';

@QueryHandler(GetDepartmentQuery)
export class GetDepartmentHandler implements IQueryHandler<
  GetDepartmentQuery,
  DepartmentListItemReadModel
> {
  public constructor(
    @Inject(DEPARTMENTS_REPOSITORY)
    private readonly departmentsRepository: IDepartmentsRepository,
  ) {}

  public async execute(
    query: GetDepartmentQuery,
  ): Promise<DepartmentListItemReadModel> {
    const department = await this.departmentsRepository.findById(query.id);

    if (!department) {
      throw new NotFoundException(`Department id ${query.id} not found`);
    }

    return new DepartmentListItemReadModel(
      department.getId(),
      department.getName(),
      department.getDeletedAt(),
      department.getCreatedAt(),
      department.getUpdatedAt(),
    );
  }
}
