import { type EmployeeStatus } from '../../../domain/enums/employee-status.enum';

export class UpdateEmployeeResponse {
  public constructor(
    public readonly id: string,
    public readonly departmentId: string,
    public readonly position: string | null,
    public readonly status: EmployeeStatus,
  ) {}
}
