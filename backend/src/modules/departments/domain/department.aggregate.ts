import { Id } from '../../../shared/domain/value-objects/id.value-object';
import {
  DepartmentAlreadyDisabledException,
  DepartmentDisabledException,
  DepartmentNameRequiredException,
  DepartmentNameTooLongException,
  DepartmentNotDisabledException,
} from './exceptions/department.exceptions';

const MAX_NAME_LENGTH = 255;

export type CreateDepartmentProps = {
  name: string;
};

export type FromPersistentDepartmentProps = {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
};

export class Department {
  private constructor(
    private readonly id: Id,
    private name: string,
    private deletedAt: Date | null,
    private readonly createdAt: Date,
    private updatedAt: Date,
  ) {}

  public static create(props: CreateDepartmentProps): Department {
    const now = new Date();

    return new Department(
      Id.generate(),
      Department.normalizeName(props.name),
      null,
      now,
      now,
    );
  }

  public static fromPersistent(
    props: FromPersistentDepartmentProps,
  ): Department {
    return new Department(
      Id.create(props.id),
      props.name,
      props.deletedAt ?? null,
      props.createdAt,
      props.updatedAt,
    );
  }

  public rename(name: string): void {
    this.assertActive();

    this.name = Department.normalizeName(name);
    this.touch();
  }

  public softDelete(): void {
    if (this.isDeleted()) {
      throw new DepartmentAlreadyDisabledException();
    }

    this.deletedAt = new Date();
    this.touch();
  }

  public restore(): void {
    if (!this.isDeleted()) {
      throw new DepartmentNotDisabledException();
    }

    this.deletedAt = null;
    this.touch();
  }

  public isDeleted(): boolean {
    return this.deletedAt !== null;
  }

  public getId(): string {
    return this.id.getValue();
  }

  public getName(): string {
    return this.name;
  }

  public getDeletedAt(): Date | null {
    return this.deletedAt;
  }

  public getCreatedAt(): Date {
    return this.createdAt;
  }

  public getUpdatedAt(): Date {
    return this.updatedAt;
  }

  private assertActive(): void {
    if (this.isDeleted()) {
      throw new DepartmentDisabledException();
    }
  }

  private touch(): void {
    this.updatedAt = new Date();
  }

  private static normalizeName(raw: string): string {
    const name = raw?.trim();

    if (!name) {
      throw new DepartmentNameRequiredException();
    }

    if (name.length > MAX_NAME_LENGTH) {
      throw new DepartmentNameTooLongException(MAX_NAME_LENGTH);
    }

    return name;
  }
}
