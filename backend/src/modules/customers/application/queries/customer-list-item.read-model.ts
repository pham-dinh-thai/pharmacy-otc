import type { CustomerDetailReadModel } from './customer-detail.read-model';

export class CustomerListItemReadModel {
  public constructor(
    public readonly id: string,
    public readonly firstName: string,
    public readonly lastName: string,
    public readonly email: string,
    public readonly primaryPhone: string,
    public readonly phoneCount: number,
    public readonly gender: CustomerDetailReadModel['gender'],
    public readonly dateOfBirth: Date | null,
    public readonly deletedAt: Date | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  public static fromDetail(
    detail: CustomerDetailReadModel,
  ): CustomerListItemReadModel {
    const primaryPhone =
      detail.phones.find((phone) => phone.isPrimary)?.phone ??
      detail.phones[0]?.phone ??
      '';

    return new CustomerListItemReadModel(
      detail.id,
      detail.firstName,
      detail.lastName,
      detail.email,
      primaryPhone,
      detail.phones.length,
      detail.gender,
      detail.dateOfBirth,
      detail.deletedAt,
      detail.createdAt,
      detail.updatedAt,
    );
  }
}
