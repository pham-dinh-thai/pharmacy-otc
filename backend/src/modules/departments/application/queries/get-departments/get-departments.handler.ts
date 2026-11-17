import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
  DEPARTMENTS_REPOSITORY,
  type IDepartmentsRepository,
} from '../../../domain/departments.repository';
import { GetDepartmentsQuery } from './get-departments.query';
import { DepartmentListItemReadModel } from './department-list-item.read-model';

@QueryHandler(GetDepartmentsQuery)
export class GetDepartmentsHandler implements IQueryHandler<
  GetDepartmentsQuery,
  DepartmentListItemReadModel[]
> {
  public constructor(
    @Inject(DEPARTMENTS_REPOSITORY)
    private readonly departmentsRepository: IDepartmentsRepository,
  ) {}

  public async execute(): Promise<DepartmentListItemReadModel[]> {
    const departments = await this.departmentsRepository.findAll();

    return departments.map(
      (department) =>
        new DepartmentListItemReadModel(
          department.getId(),
          department.getName(),
          department.getDeletedAt(),
          department.getCreatedAt(),
          department.getUpdatedAt(),
        ),
    );
  }
}
