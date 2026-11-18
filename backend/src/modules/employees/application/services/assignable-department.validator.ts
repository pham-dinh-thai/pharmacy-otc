import { Inject, Injectable } from '@nestjs/common';
import {
  DepartmentDisabledException,
  DepartmentNotFoundException,
} from '../../../departments/domain/exceptions/department.exceptions';
import {
  DEPARTMENTS_REPOSITORY,
  type IDepartmentsRepository,
} from '../../../departments/domain/departments.repository';

@Injectable()
export class AssignableDepartmentValidator {
  public constructor(
    @Inject(DEPARTMENTS_REPOSITORY)
    private readonly departmentsRepository: IDepartmentsRepository,
  ) {}

  public async validate(departmentId: string): Promise<void> {
    const department = await this.departmentsRepository.findById(departmentId);

    if (!department) {
      throw new DepartmentNotFoundException(departmentId);
    }

    if (department.isDeleted()) {
      throw new DepartmentDisabledException();
    }
  }
}
