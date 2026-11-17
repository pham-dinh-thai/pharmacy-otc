import { Id } from '../../../shared/value-objects/id.value-object';
import { EmployeeStatus } from './enums/employee-status.enum';

export type FromPersistentEmployeeProps = {
  id: string;
  userId: string;
  departmentId: string;
  position: string | null;
  status: EmployeeStatus;
  createdAt: Date;
  updatedAt: Date;
};

export class Employee {
  private constructor(
    private readonly id: Id,
    private readonly userId: string,
    private readonly departmentId: string,
    private position: string | null,
    private status: EmployeeStatus,
    private readonly createdAt: Date,
    private updatedAt: Date,
  ) {}

  public static fromPersistent(props: FromPersistentEmployeeProps): Employee {
    return new Employee(
      Id.create(props.id),
      props.userId,
      props.departmentId,
      props.position,
      props.status,
      props.createdAt,
      props.updatedAt,
    );
  }

  public changeStatus(status: EmployeeStatus): void {
    this.status = status;

    this.updatedAt = new Date();
  }

  public getId(): string {
    return this.id.getValue();
  }

  public getUserId(): string {
    return this.userId;
  }

  public getDepartmentId(): string {
    return this.departmentId;
  }

  public getPosition(): string | null {
    return this.position;
  }

  public getStatus(): EmployeeStatus {
    return this.status;
  }

  public getCreatedAt(): Date {
    return this.createdAt;
  }

  public getUpdatedAt(): Date {
    return this.updatedAt;
  }
}
