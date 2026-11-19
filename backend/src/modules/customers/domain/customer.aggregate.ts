import { Id } from '../../../shared/value-objects/id.value-object';
import { CustomerAddress } from './value-objects/customer-address';
import type {
  CustomerAddressInput,
  CustomerAddressPersistentProps,
} from './value-objects/customer-address';
import { CustomerPhone } from './value-objects/customer-phone';
import type {
  CustomerPhoneInput,
  CustomerPhonePersistentProps,
} from './value-objects/customer-phone';
import { CustomerGender } from './enums/customer-gender.enum';
import {
  CustomerAddressRequiredException,
  CustomerPhoneRequiredException,
} from './exceptions/customer.exceptions';

export type CustomerProfileInput = {
  gender?: CustomerGender | null;
  dateOfBirth?: Date | null;
  phones: CustomerPhoneInput[];
  addresses: CustomerAddressInput[];
};

export type CreateCustomerProps = CustomerProfileInput & {
  userId: string;
};

export type FromPersistentCustomerProps = CustomerProfileInput & {
  id: string;
  userId: string;
  phones: CustomerPhonePersistentProps[];
  addresses: CustomerAddressPersistentProps[];
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export class Customer {
  private constructor(
    private readonly id: Id,
    private readonly userId: string,
    private gender: CustomerGender | null,
    private dateOfBirth: Date | null,
    private phones: CustomerPhone[],
    private addresses: CustomerAddress[],
    private deletedAt: Date | null,
    private readonly createdAt: Date,
    private updatedAt: Date,
  ) {}

  public static create(props: CreateCustomerProps): Customer {
    const now = new Date();

    return new Customer(
      Id.generate(),
      props.userId,
      props.gender ?? null,
      props.dateOfBirth ?? null,
      Customer.normalizePhones(props.phones),
      Customer.normalizeAddresses(props.addresses),
      null,
      now,
      now,
    );
  }

  public static fromPersistent(props: FromPersistentCustomerProps): Customer {
    return new Customer(
      Id.create(props.id),
      props.userId,
      props.gender ?? null,
      props.dateOfBirth ?? null,
      Customer.normalizePersistedPhones(props.phones),
      Customer.normalizePersistedAddresses(props.addresses),
      props.deletedAt,
      props.createdAt,
      props.updatedAt,
    );
  }

  public getId(): string {
    return this.id.getValue();
  }

  public getUserId(): string {
    return this.userId;
  }

  public getGender(): CustomerGender | null {
    return this.gender;
  }

  public getDateOfBirth(): Date | null {
    return this.dateOfBirth;
  }

  public getPhones(): readonly CustomerPhone[] {
    return this.phones;
  }

  public getAddresses(): readonly CustomerAddress[] {
    return this.addresses;
  }

  public getDeletedAt(): Date | null {
    return this.deletedAt;
  }

  public isDeleted(): boolean {
    return this.deletedAt !== null;
  }

  public getCreatedAt(): Date {
    return this.createdAt;
  }

  public getUpdatedAt(): Date {
    return this.updatedAt;
  }

  public update(props: CustomerProfileInput): void {
    this.gender = props.gender ?? null;
    this.dateOfBirth = props.dateOfBirth ?? null;
    this.phones = Customer.normalizePhones(props.phones);
    this.addresses = Customer.normalizeAddresses(props.addresses);
    this.updatedAt = new Date();
  }

  public softDelete(): void {
    this.deletedAt = new Date();
    this.updatedAt = this.deletedAt;
  }

  public restore(): void {
    this.deletedAt = null;
    this.updatedAt = new Date();
  }

  private static normalizePhones(
    inputs: CustomerPhoneInput[],
  ): CustomerPhone[] {
    const phones = inputs.map((input) => CustomerPhone.create(input));

    if (phones.length === 0) {
      throw new CustomerPhoneRequiredException();
    }

    const primary = phones.find((phone) => phone.getIsPrimary()) ?? phones[0];
    phones.forEach((phone) => phone.setIsPrimary(phone === primary));

    return phones;
  }

  private static normalizeAddresses(
    inputs: CustomerAddressInput[],
  ): CustomerAddress[] {
    const addresses = inputs.map((input) => CustomerAddress.create(input));

    if (addresses.length === 0) {
      throw new CustomerAddressRequiredException();
    }

    const primary =
      addresses.find((address) => address.getIsDefault()) ?? addresses[0];
    addresses.forEach((address) => address.setIsDefault(address === primary));

    return addresses;
  }

  private static normalizePersistedPhones(
    props: CustomerPhonePersistentProps[],
  ): CustomerPhone[] {
    return props.map((phone) => CustomerPhone.fromPersistent(phone));
  }

  private static normalizePersistedAddresses(
    props: CustomerAddressPersistentProps[],
  ): CustomerAddress[] {
    return props.map((address) => CustomerAddress.fromPersistent(address));
  }
}
