import { type EmployeeStatus } from '../../../domain/enums/employee-status.enum';
import { type EmployeePosition } from '../../../domain/enums/employee-position.enum';

export class UpdateEmployeeResponse {
  public constructor(
    public readonly id: string,
    public readonly departmentId: string,
    public readonly position: EmployeePosition | null,
    public readonly status: EmployeeStatus,
  ) {}
}
