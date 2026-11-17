import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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
      throw new NotFoundException(`Department id ${departmentId} not found`);
    }

    if (department.isDeleted()) {
      throw new ConflictException('Department is disabled');
    }
  }
}
