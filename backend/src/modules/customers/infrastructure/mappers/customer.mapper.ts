import { Customer } from '../../domain/customer.aggregate';
import type { CustomerAddress } from '../../domain/value-objects/customer-address';
import type { CustomerPhone } from '../../domain/value-objects/customer-phone';
import { MikroCustomerAddress } from '../entities/mikro-customer-address.entity';
import { MikroCustomerPhone } from '../entities/mikro-customer-phone.entity';
import { MikroCustomer } from '../entities/mikro-customer.entity';

export class CustomerMapper {
  public static toMikroOrm(customer: Customer): MikroCustomer {
    const mikroCustomer = new MikroCustomer();

    mikroCustomer.id = customer.getId();
    mikroCustomer.userId = customer.getUserId();
    mikroCustomer.gender = customer.getGender();
    mikroCustomer.dateOfBirth = customer.getDateOfBirth();
    mikroCustomer.deletedAt = customer.getDeletedAt();
    mikroCustomer.createdAt = customer.getCreatedAt();
    mikroCustomer.updatedAt = customer.getUpdatedAt();

    return mikroCustomer;
  }

  public static phoneToMikroOrm(
    phone: CustomerPhone,
    customerId: string,
  ): MikroCustomerPhone {
    const mikroPhone = new MikroCustomerPhone();

    mikroPhone.id = phone.getId();
    mikroPhone.customerId = customerId;
    mikroPhone.phone = phone.getPhone();
    mikroPhone.isPrimary = phone.getIsPrimary();

    return mikroPhone;
  }

  public static addressToMikroOrm(
    address: CustomerAddress,
    customerId: string,
  ): MikroCustomerAddress {
    const mikroAddress = new MikroCustomerAddress();

    mikroAddress.id = address.getId();
    mikroAddress.customerId = customerId;
    mikroAddress.address = address.getAddress();
    mikroAddress.isDefault = address.getIsDefault();

    return mikroAddress;
  }

  public static toDomain(
    mikroCustomer: MikroCustomer,
    mikroPhones: MikroCustomerPhone[],
    mikroAddresses: MikroCustomerAddress[],
  ): Customer {
    return Customer.fromPersistent({
      id: mikroCustomer.id,
      userId: mikroCustomer.userId,
      gender: mikroCustomer.gender,
      dateOfBirth: mikroCustomer.dateOfBirth,
      phones: mikroPhones.map((phone) => ({
        id: phone.id,
        phone: phone.phone,
        isPrimary: phone.isPrimary,
      })),
      addresses: mikroAddresses.map((address) => ({
        id: address.id,
        address: address.address,
        isDefault: address.isDefault,
      })),
      deletedAt: mikroCustomer.deletedAt,
      createdAt: mikroCustomer.createdAt,
      updatedAt: mikroCustomer.updatedAt,
    });
  }
}
