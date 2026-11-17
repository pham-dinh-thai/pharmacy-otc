import { type EmployeeStatus } from '../../domain/enums/employee-status.enum';

export class EmployeeReadModel {
  public constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly firstName: string,
    public readonly lastName: string,
    public readonly email: string,
    public readonly departmentId: string,
    public readonly departmentName: string,
    public readonly position: string | null,
    public readonly status: EmployeeStatus,
    public readonly isActive: boolean,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
}
