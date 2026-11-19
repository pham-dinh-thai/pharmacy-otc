import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { CustomerNotFoundException } from '../../../domain/exceptions/customer.exceptions';
import {
  CUSTOMERS_REPOSITORY,
  type ICustomersRepository,
} from '../../../domain/customers.repository';
import { CustomerDetailReadModel } from '../customer-detail.read-model';
import { CustomerReadModelFactory } from '../customer-read-model.factory';
import { GetCustomerQuery } from './get-customer.query';

@QueryHandler(GetCustomerQuery)
export class GetCustomerHandler implements IQueryHandler<
  GetCustomerQuery,
  CustomerDetailReadModel
> {
  public constructor(
    @Inject(CUSTOMERS_REPOSITORY)
    private readonly customersRepository: ICustomersRepository,

    private readonly readModelFactory: CustomerReadModelFactory,
  ) {}

  public async execute(
    query: GetCustomerQuery,
  ): Promise<CustomerDetailReadModel> {
    const customer = await this.customersRepository.findByIdIncludingDeleted(
      query.id,
    );

    if (!customer) {
      throw new CustomerNotFoundException(query.id);
    }

    return this.readModelFactory.create(customer);
  }
}
