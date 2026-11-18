import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
  DEPARTMENTS_REPOSITORY,
  type IDepartmentsRepository,
} from '../../../domain/departments.repository';
import { DepartmentListItemReadModel } from './department-list-item.read-model';
import { DepartmentPageReadModel } from './department-page.read-model';
import { GetDepartmentsQuery } from './get-departments.query';

@QueryHandler(GetDepartmentsQuery)
export class GetDepartmentsHandler implements IQueryHandler<
  GetDepartmentsQuery,
  DepartmentPageReadModel
> {
  public constructor(
    @Inject(DEPARTMENTS_REPOSITORY)
    private readonly departmentsRepository: IDepartmentsRepository,
  ) {}

  public async execute(
    query: GetDepartmentsQuery,
  ): Promise<DepartmentPageReadModel> {
    const { page, limit } = query;
    const result = await this.departmentsRepository.findPage({
      limit,
      offset: (page - 1) * limit,
    });

    return new DepartmentPageReadModel(
      result.items.map(
        (department) =>
          new DepartmentListItemReadModel(
            department.getId(),
            department.getName(),
            department.getDeletedAt(),
            department.getCreatedAt(),
            department.getUpdatedAt(),
          ),
      ),
      result.total,
      page,
      limit,
    );
  }
}
