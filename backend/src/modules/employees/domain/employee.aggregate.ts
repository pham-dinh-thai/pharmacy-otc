import { UnprocessableEntityException } from '@nestjs/common';
import { Id } from '../../../shared/value-objects/id.value-object';
import { EmployeeStatus } from './enums/employee-status.enum';

const MAX_POSITION_LENGTH = 255;

export type CreateEmployeeProps = {
  userId: string;
  departmentId: string;
  position?: string | null;
  status?: EmployeeStatus;
};

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
    private departmentId: string,
    private position: string | null,
    private status: EmployeeStatus,
    private readonly createdAt: Date,
    private updatedAt: Date,
  ) {}

  public static create(props: CreateEmployeeProps): Employee {
    const now = new Date();

    return new Employee(
      Id.generate(),
      Employee.normalizeId(props.userId, 'User id is required'),
      Employee.normalizeId(props.departmentId, 'Department id is required'),
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
    position?: string | null,
  ): void {
    const nextDepartmentId = Employee.normalizeId(
      departmentId,
      'Department id is required',
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

  private touch(): void {
    this.updatedAt = new Date();
  }

  private static normalizeId(raw: string, message: string): string {
    const value = raw?.trim();

    if (!value) {
      throw new UnprocessableEntityException(message);
    }

    return value;
  }

  private static normalizePosition(raw?: string | null): string | null {
    if (raw === undefined || raw === null) {
      return null;
    }

    const position = raw.trim();

    if (!position) {
      return null;
    }

    if (position.length > MAX_POSITION_LENGTH) {
      throw new UnprocessableEntityException(
        `Position must have at most ${MAX_POSITION_LENGTH} characters`,
      );
    }

    return position;
  }
}
