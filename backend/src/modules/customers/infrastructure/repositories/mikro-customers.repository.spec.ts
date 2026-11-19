import { describe, expect, it, jest } from '@jest/globals';
import { type EntityManager } from '@mikro-orm/core';
import { MikroCustomersRepository } from './mikro-customers.repository';
import { MikroCustomer } from '../entities/mikro-customer.entity';
import { MikroCustomerPhone } from '../entities/mikro-customer-phone.entity';
import { MikroCustomerAddress } from '../entities/mikro-customer-address.entity';
import { MikroUser } from '../../../users/infrastructure/entities/mikro-user.entity';
import { Customer } from '../../domain/customer.aggregate';

const CUSTOMER_ID = '4e770b20-0ab6-494a-9bfd-e475e07c7a17';
const USER_ID = '7d0d2c55-9a9d-4c7d-9f6a-3f7f5a1b2c3d';
const DELETED_AT = new Date('2026-02-01T00:00:00Z');

const persistentCustomer = (deletedAt: Date | null = null): MikroCustomer =>
  Object.assign(new MikroCustomer(), {
    id: CUSTOMER_ID,
    userId: USER_ID,
    gender: null,
    dateOfBirth: null,
    deletedAt,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  });

const setup = () => {
  const findAndCount = jest
    .fn<
      (entity: unknown, where: unknown, options: unknown) => Promise<unknown[]>
    >()
    .mockResolvedValue([[], 0]);
  const findOne = jest
    .fn<(entity: unknown, where: unknown) => Promise<unknown>>()
    .mockResolvedValue(null);
  const find = jest
    .fn<
      (entity: unknown, where: unknown, options?: unknown) => Promise<any[]>
    >()
    .mockResolvedValue([]);
  const insert = jest
    .fn<(value: unknown) => Promise<unknown>>()
    .mockResolvedValue(undefined);
  const nativeUpdate = jest
    .fn<(entity: unknown, where: unknown, values: unknown) => Promise<number>>()
    .mockResolvedValue(1);
  const nativeDelete = jest
    .fn<(entity: unknown, where: unknown) => Promise<number>>()
    .mockResolvedValue(0);
  const entityManager = {
    findAndCount,
    findOne,
    find,
    insert,
    nativeUpdate,
    nativeDelete,
  } as unknown as EntityManager;

  return {
    repository: new MikroCustomersRepository(entityManager),
    findAndCount,
    findOne,
    find,
    insert,
    nativeUpdate,
    nativeDelete,
  };
};

describe('MikroCustomersRepository', () => {
  it('defaults to all deleted states with page ordering and limits', async () => {
    const { repository, findAndCount } = setup();

    await repository.findPage({ limit: 10, offset: 20 });

    expect(findAndCount).toHaveBeenCalledWith(
      MikroCustomer,
      {},
      { orderBy: { createdAt: 'desc' }, limit: 10, offset: 20 },
    );
  });

  it('filters by deleted state', async () => {
    const { repository, findAndCount } = setup();

    await repository.findPage({ deleted: false, limit: 20, offset: 0 });
    expect(findAndCount.mock.calls[0][1]).toEqual({ deletedAt: null });

    await repository.findPage({ deleted: true, limit: 20, offset: 0 });
    expect(findAndCount.mock.calls[1][1]).toEqual({
      deletedAt: { $ne: null },
    });
  });

  it('searches user name and email, returning no rows when no user matches', async () => {
    const { repository, find, findAndCount } = setup();
    find.mockResolvedValue([{ id: USER_ID }]);

    await repository.findPage({ search: '  nguyen  ', limit: 20, offset: 0 });

    expect(find).toHaveBeenCalledWith(
      MikroUser,
      {
        $or: [
          { firstName: { $ilike: '%nguyen%' } },
          { lastName: { $ilike: '%nguyen%' } },
          { email: { $ilike: '%nguyen%' } },
        ],
      },
      { fields: ['id'] },
    );
    expect(findAndCount.mock.calls[0][1]).toEqual({
      userId: { $in: [USER_ID] },
    });

    find.mockResolvedValue([]);
    const result = await repository.findPage({
      search: 'khong-ton-tai',
      limit: 20,
      offset: 0,
    });

    expect(result).toEqual({ items: [], total: 0 });
    expect(findAndCount).toHaveBeenCalledTimes(1);
  });

  it('maps customer with phones and addresses', async () => {
    const { repository, findAndCount, find } = setup();
    findAndCount.mockResolvedValue([[persistentCustomer(DELETED_AT)], 1]);
    find
      .mockResolvedValueOnce([
        Object.assign(new MikroCustomerPhone(), {
          id: 'b3d7f2a8-7a0e-4f1c-9c1a-4d3f5e6a7b8c',
          customerId: CUSTOMER_ID,
          phone: '0901234567',
          isPrimary: true,
        }),
      ])
      .mockResolvedValueOnce([
        Object.assign(new MikroCustomerAddress(), {
          id: 'a1b2c3d4-5e6f-4a7b-8c9d-0e1f2a3b4c5d',
          customerId: CUSTOMER_ID,
          address: '12 Nguyễn Huệ',
          isDefault: true,
        }),
      ]);

    const result = await repository.findPage({ limit: 20, offset: 0 });

    expect(result.total).toBe(1);
    expect(result.items[0].getId()).toBe(CUSTOMER_ID);
    expect(result.items[0].getPhones()[0].getPhone()).toBe('0901234567');
    expect(result.items[0].getAddresses()[0].getAddress()).toBe(
      '12 Nguyễn Huệ',
    );
    expect(result.items[0].getDeletedAt()).toEqual(DELETED_AT);
  });

  it('excludes deleted records in findById but includes them in findByIdIncludingDeleted', async () => {
    const { repository, findOne } = setup();
    findOne.mockResolvedValueOnce(persistentCustomer(DELETED_AT));

    await repository.findById(CUSTOMER_ID);
    expect(findOne.mock.calls[0][1]).toEqual({
      id: CUSTOMER_ID,
      deletedAt: null,
    });

    findOne.mockResolvedValueOnce(persistentCustomer(DELETED_AT));
    await repository.findByIdIncludingDeleted(CUSTOMER_ID);
    expect(findOne.mock.calls[1][1]).toEqual({ id: CUSTOMER_ID });
  });

  it('replaces phones and addresses on update', async () => {
    const { repository, nativeUpdate, nativeDelete, insert } = setup();
    const customer = Customer.create({
      userId: USER_ID,
      phones: [{ phone: '0901234567' }],
      addresses: [{ address: '12 Nguyễn Huệ' }],
    });

    await repository.update(customer);

    expect(nativeUpdate).toHaveBeenCalledWith(
      MikroCustomer,
      { id: customer.getId(), userId: USER_ID },
      expect.objectContaining({ deletedAt: null }),
    );
    expect(nativeDelete).toHaveBeenCalledWith(MikroCustomerPhone, {
      customerId: customer.getId(),
    });
    expect(nativeDelete).toHaveBeenCalledWith(MikroCustomerAddress, {
      customerId: customer.getId(),
    });
    expect(insert).toHaveBeenCalledTimes(2);
  });
});
