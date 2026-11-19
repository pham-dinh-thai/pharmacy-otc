import { describe, expect, it } from '@jest/globals';
import { CustomerGender } from './enums/customer-gender.enum';
import {
  CustomerAddressRequiredException,
  CustomerPhoneRequiredException,
} from './exceptions/customer.exceptions';
import { Customer } from './customer.aggregate';

const userId = '7d0d2c55-9a9d-4c7d-9f6a-3f7f5a1b2c3d';

const profile = () => ({
  gender: CustomerGender.FEMALE,
  dateOfBirth: new Date('1998-04-12T00:00:00.000Z'),
  phones: [
    { phone: ' 0901234567 ', isPrimary: false },
    { phone: '0912345678', isPrimary: true },
  ],
  addresses: [
    { address: ' 12 Nguyễn Huệ ', isDefault: false },
    { address: '34 Lê Lợi', isDefault: true },
  ],
});

describe('Customer', () => {
  it('normalizes to exactly one primary phone and one default address', () => {
    const customer = Customer.create({ userId, ...profile() });

    expect(customer.getUserId()).toBe(userId);
    expect(customer.getGender()).toBe(CustomerGender.FEMALE);
    expect(customer.getDateOfBirth()).toEqual(
      new Date('1998-04-12T00:00:00.000Z'),
    );
    expect(customer.getPhones().map((phone) => phone.getPhone())).toEqual([
      '0901234567',
      '0912345678',
    ]);
    expect(customer.getPhones().map((phone) => phone.getIsPrimary())).toEqual([
      false,
      true,
    ]);
    expect(
      customer.getAddresses().map((address) => address.getIsDefault()),
    ).toEqual([false, true]);
    expect(customer.getAddresses()[0].getAddress()).toBe('12 Nguyễn Huệ');
    expect(customer.isDeleted()).toBe(false);
  });

  it('falls back to the first contact when no primary flag is provided', () => {
    const customer = Customer.create({
      userId,
      phones: [{ phone: '0901234567' }, { phone: '0912345678' }],
      addresses: [{ address: '12 Nguyễn Huệ' }, { address: '34 Lê Lợi' }],
    });

    expect(customer.getPhones()[0].getIsPrimary()).toBe(true);
    expect(customer.getPhones()[1].getIsPrimary()).toBe(false);
    expect(customer.getAddresses()[0].getIsDefault()).toBe(true);
    expect(customer.getAddresses()[1].getIsDefault()).toBe(false);
  });

  it('requires at least one phone and one address', () => {
    expect(() =>
      Customer.create({
        userId,
        phones: [],
        addresses: [{ address: '12 Nguyễn Huệ' }],
      }),
    ).toThrow(CustomerPhoneRequiredException);

    expect(() =>
      Customer.create({
        userId,
        phones: [{ phone: '0901234567' }],
        addresses: [],
      }),
    ).toThrow(CustomerAddressRequiredException);
  });

  it('keeps contact ids across an update', () => {
    const customer = Customer.create({ userId, ...profile() });
    const phoneId = customer.getPhones()[0].getId();
    const addressId = customer.getAddresses()[0].getId();

    customer.update({
      ...profile(),
      phones: [{ phone: '0900000000', isPrimary: true }],
      addresses: [{ address: '1 Đường Mới', isDefault: true }],
    });

    expect(customer.getPhones()).toHaveLength(1);
    expect(customer.getPhones()[0].getId()).not.toBe(phoneId);
    expect(customer.getAddresses()[0].getId()).not.toBe(addressId);
    expect(customer.getPhones()[0].getPhone()).toBe('0900000000');
    expect(customer.getAddresses()[0].getAddress()).toBe('1 Đường Mới');
  });

  it('soft deletes and restores', () => {
    const customer = Customer.create({ userId, ...profile() });

    customer.softDelete();
    expect(customer.isDeleted()).toBe(true);
    expect(customer.getDeletedAt()).toBeInstanceOf(Date);

    customer.restore();
    expect(customer.isDeleted()).toBe(false);
    expect(customer.getDeletedAt()).toBeNull();
  });
});
