import { type DomainException } from '../../../shared/domain/exceptions/domain.exception';
import { Id } from '../../../shared/domain/value-objects/id.value-object';
import { EmployeeStatus } from './enums/employee-status.enum';
import { EmployeePosition } from './enums/employee-position.enum';
import {
  DepartmentIdRequiredException,
  InvalidEmployeePositionException,
  UserIdRequiredException,
} from './exceptions/employee.exceptions';

export type CreateEmployeeProps = {
  userId: string;
  departmentId: string;
  position?: EmployeePosition | null;
  status?: EmployeeStatus;
};

export type FromPersistentEmployeeProps = {
  id: string;
  userId: string;
  departmentId: string;
  position: EmployeePosition | null;
  status: EmployeeStatus;
  createdAt: Date;
  updatedAt: Date;
};

export class Employee {
  private constructor(
    private readonly id: Id,
    private readonly userId: string,
    private departmentId: string,
    private position: EmployeePosition | null,
    private status: EmployeeStatus,
    private readonly createdAt: Date,
    private updatedAt: Date,
  ) {}

  public static create(props: CreateEmployeeProps): Employee {
    const now = new Date();

    return new Employee(
      Id.generate(),
      Employee.normalizeId(props.userId, () => new UserIdRequiredException()),
      Employee.normalizeId(
        props.departmentId,
        () => new DepartmentIdRequiredException(),
      ),
      Employee.normalizePosition(props.position),
      props.status ?? EmployeeStatus.WORKING,
      now,
      now,
    );
  }

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

  public changeAssignment(
    departmentId: string,
    position?: EmployeePosition | null,
  ): void {
    const nextDepartmentId = Employee.normalizeId(
      departmentId,
      () => new DepartmentIdRequiredException(),
    );
    const nextPosition = Employee.normalizePosition(position);

    if (
      this.departmentId === nextDepartmentId &&
      this.position === nextPosition
    ) {
      return;
    }

    this.departmentId = nextDepartmentId;
    this.position = nextPosition;
    this.touch();
  }

  public changeStatus(status: EmployeeStatus): void {
    this.status = status;

    this.touch();
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

  public getPosition(): EmployeePosition | null {
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

  private touch(): void {
    this.updatedAt = new Date();
  }

  private static normalizeId(
    raw: string,
    error: () => DomainException,
  ): string {
    const value = raw?.trim();

    if (!value) {
      throw error();
    }

    return value;
  }

  private static normalizePosition(
    raw?: EmployeePosition | null,
  ): EmployeePosition | null {
    if (raw === undefined || raw === null) {
      return null;
    }

    if (!Object.values(EmployeePosition).includes(raw)) {
      throw new InvalidEmployeePositionException();
    }

    return raw;
  }
}
