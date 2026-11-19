import { Injectable } from '@nestjs/common';
import { EntityManager, type FilterQuery } from '@mikro-orm/core';
import { MikroUser } from '../../../users/infrastructure/entities/mikro-user.entity';
import { likePattern } from '../../../../shared/utils/list-filters';
import { Customer } from '../../domain/customer.aggregate';
import type {
  CustomerPage,
  FindCustomersOptions,
  ICustomersRepository,
} from '../../domain/customers.repository';
import { CustomerMapper } from '../mappers/customer.mapper';
import { MikroCustomerAddress } from '../entities/mikro-customer-address.entity';
import { MikroCustomerPhone } from '../entities/mikro-customer-phone.entity';
import { MikroCustomer } from '../entities/mikro-customer.entity';

@Injectable()
export class MikroCustomersRepository implements ICustomersRepository {
  public constructor(private readonly entityManager: EntityManager) {}

  public async findPage(options: FindCustomersOptions): Promise<CustomerPage> {
    const userIds = await this.searchUserIds(options.search);

    if (userIds !== undefined && userIds.length === 0) {
      return { items: [], total: 0 };
    }

    const where: FilterQuery<MikroCustomer> = {
      ...(options.deleted === true
        ? { deletedAt: { $ne: null } }
        : options.deleted === false
          ? { deletedAt: null }
          : {}),
      ...(userIds ? { userId: { $in: userIds } } : {}),
    };

    const [rows, total] = await this.entityManager.findAndCount(
      MikroCustomer,
      where,
      {
        orderBy: { createdAt: 'desc' },
        limit: options.limit,
        offset: options.offset,
      },
    );

    return {
      items: await Promise.all(rows.map((row) => this.toDomain(row))),
      total,
    };
  }

  public async findById(id: string): Promise<Customer | null> {
    return this.findOne(id, { deletedAt: null });
  }

  public async findByIdIncludingDeleted(id: string): Promise<Customer | null> {
    return this.findOne(id, {});
  }

  public async existsByIdAndUserId(
    id: string,
    userId: string,
  ): Promise<boolean> {
    const row = await this.entityManager.findOne(MikroCustomer, { id, userId });

    return !!row;
  }

  public async create(customer: Customer): Promise<Customer> {
    await this.entityManager.insert(CustomerMapper.toMikroOrm(customer));
    await this.insertContacts(customer);

    return customer;
  }

  public async update(customer: Customer): Promise<Customer> {
    const id = customer.getId();

    await this.entityManager.nativeUpdate(
      MikroCustomer,
      { id, userId: customer.getUserId() },
      {
        gender: customer.getGender(),
        dateOfBirth: customer.getDateOfBirth(),
        deletedAt: customer.getDeletedAt(),
        updatedAt: customer.getUpdatedAt(),
      },
    );
    await this.entityManager.nativeDelete(MikroCustomerPhone, {
      customerId: id,
    });
    await this.entityManager.nativeDelete(MikroCustomerAddress, {
      customerId: id,
    });
    await this.insertContacts(customer);

    return customer;
  }

  private async searchUserIds(
    search: string | undefined,
  ): Promise<string[] | undefined> {
    const pattern = likePattern(search);

    if (!pattern) return undefined;

    const users = await this.entityManager.find(
      MikroUser,
      {
        $or: [
          { firstName: { $ilike: pattern } },
          { lastName: { $ilike: pattern } },
          { email: { $ilike: pattern } },
        ],
      },
      { fields: ['id'] },
    );

    return users.map((user) => user.id);
  }

  private async findOne(
    id: string,
    where: FilterQuery<MikroCustomer>,
  ): Promise<Customer | null> {
    const row = await this.entityManager.findOne(MikroCustomer, {
      id,
      ...(where as object),
    });

    return row ? this.toDomain(row) : null;
  }

  private async toDomain(row: MikroCustomer): Promise<Customer> {
    const [phones, addresses] = await Promise.all([
      this.entityManager.find(
        MikroCustomerPhone,
        { customerId: row.id },
        { orderBy: { createdAt: 'asc' } },
      ),
      this.entityManager.find(
        MikroCustomerAddress,
        { customerId: row.id },
        { orderBy: { createdAt: 'asc' } },
      ),
    ]);

    return CustomerMapper.toDomain(row, phones, addresses);
  }

  private async insertContacts(customer: Customer): Promise<void> {
    const id = customer.getId();

    for (const phone of customer.getPhones()) {
      await this.entityManager.insert(
        CustomerMapper.phoneToMikroOrm(phone, id),
      );
    }

    for (const address of customer.getAddresses()) {
      await this.entityManager.insert(
        CustomerMapper.addressToMikroOrm(address, id),
      );
    }
  }
}
