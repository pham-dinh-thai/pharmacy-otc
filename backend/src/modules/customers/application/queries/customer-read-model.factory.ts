import { Inject, Injectable } from '@nestjs/common';
import { UserByIdNotFoundException } from '../../../users/domain/exceptions/user.exceptions';
import {
  USERS_REPOSITORY,
  type IUsersRepository,
} from '../../../users/domain/users.repository';
import { Customer } from '../../domain/customer.aggregate';
import { CustomerDetailReadModel } from './customer-detail.read-model';

@Injectable()
export class CustomerReadModelFactory {
  public constructor(
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: IUsersRepository,
  ) {}

  public async create(customer: Customer): Promise<CustomerDetailReadModel> {
    const user = await this.usersRepository.findById(customer.getUserId());

    if (!user) {
      throw new UserByIdNotFoundException(
        customer.getUserId(),
        `User id ${customer.getUserId()} for customer ${customer.getId()} not found`,
      );
    }

    return new CustomerDetailReadModel(
      customer.getId(),
      user.getId(),
      user.getFirstName(),
      user.getLastName(),
      user.getEmail(),
      customer.getGender(),
      customer.getDateOfBirth(),
      customer.getPhones().map((phone) => ({
        id: phone.getId(),
        phone: phone.getPhone(),
        isPrimary: phone.getIsPrimary(),
      })),
      customer.getAddresses().map((address) => ({
        id: address.getId(),
        address: address.getAddress(),
        isDefault: address.getIsDefault(),
      })),
      customer.getDeletedAt(),
      customer.getCreatedAt(),
      customer.getUpdatedAt(),
    );
  }
}
