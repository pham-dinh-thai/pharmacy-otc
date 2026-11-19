import type { CustomerGender } from '../../domain/enums/customer-gender.enum';

export type CustomerPhoneReadModel = {
  id: string;
  phone: string;
  isPrimary: boolean;
};

export type CustomerAddressReadModel = {
  id: string;
  address: string;
  isDefault: boolean;
};

export class CustomerDetailReadModel {
  public constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly firstName: string,
    public readonly lastName: string,
    public readonly email: string,
    public readonly gender: CustomerGender | null,
    public readonly dateOfBirth: Date | null,
    public readonly phones: CustomerPhoneReadModel[],
    public readonly addresses: CustomerAddressReadModel[],
    public readonly deletedAt: Date | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}
}
