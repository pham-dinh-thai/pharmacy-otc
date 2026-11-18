import {
  SupplierAlreadyDeletedException,
  SupplierNotDeletedException,
} from './exceptions/supplier.exceptions';
import { Id } from '../../../shared/value-objects/id.value-object';
import { SupplierCode } from './value-objects/supplier-code.value-object';
import { SupplierPhone } from './value-objects/supplier-phone.value-object';

export type CreateSupplierProps = {
  sequence: number;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  taxCode: string | null;
};

export type FromPersistentSupplierProps = {
  id: string;
  code: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  taxCode: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
};

export type UpdateSupplierProps = {
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  taxCode: string | null;
};

export class Supplier {
  private constructor(
    private readonly id: Id,
    private readonly code: SupplierCode,
    private name: string,
    private readonly createdAt: Date,
    private updatedAt: Date,
    private deletedAt: Date | null,
    private phone: SupplierPhone | null,
    private email: string | null,
    private address: string | null,
    private taxCode: string | null,
  ) {}

  public static create(props: CreateSupplierProps): Supplier {
    const now = new Date();

    return new Supplier(
      Id.generate(),
      SupplierCode.fromNumber(props.sequence),
      props.name,
      now,
      now,
      null,
      props.phone ? SupplierPhone.create(props.phone) : null,
      props.email,
      props.address,
      props.taxCode,
    );
  }

  public static fromPersistent(props: FromPersistentSupplierProps): Supplier {
    return new Supplier(
      Id.create(props.id),
      SupplierCode.create(props.code),
      props.name,
      props.createdAt,
      props.updatedAt,
      props.deletedAt ?? null,
      props.phone ? SupplierPhone.create(props.phone) : null,
      props.email,
      props.address,
      props.taxCode,
    );
  }

  public update(props: UpdateSupplierProps): void {
    this.name = props.name;
    this.phone = props.phone ? SupplierPhone.create(props.phone) : null;
    this.email = props.email;
    this.address = props.address;
    this.taxCode = props.taxCode;

    this.updatedAt = new Date();
  }

  public softDelete(): void {
    if (this.isDeleted()) {
      throw new SupplierAlreadyDeletedException();
    }

    this.deletedAt = new Date();

    this.updatedAt = new Date();
  }

  public restore(): void {
    if (!this.isDeleted()) {
      throw new SupplierNotDeletedException();
    }

    this.deletedAt = null;

    this.updatedAt = new Date();
  }

  public isDeleted(): boolean {
    return this.deletedAt !== null;
  }

  public getId(): string {
    return this.id.getValue();
  }

  public getCode(): string {
    return this.code.getValue();
  }

  public getName(): string {
    return this.name;
  }

  public getCreatedAt(): Date {
    return new Date(this.createdAt);
  }

  public getUpdatedAt(): Date {
    return new Date(this.updatedAt);
  }

  public getDeletedAt(): Date | null {
    return this.deletedAt;
  }

  public getPhone(): string | null {
    return this.phone?.getValue() ?? null;
  }

  public getEmail(): string | null {
    return this.email;
  }

  public getAddress(): string | null {
    return this.address;
  }

  public getTaxCode(): string | null {
    return this.taxCode;
  }
}
