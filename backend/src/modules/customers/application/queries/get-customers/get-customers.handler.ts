import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
  CUSTOMERS_REPOSITORY,
  type ICustomersRepository,
} from '../../../domain/customers.repository';
import { CustomerListItemReadModel } from '../customer-list-item.read-model';
import { CustomerPageReadModel } from '../customer-page.read-model';
import { CustomerReadModelFactory } from '../customer-read-model.factory';
import { GetCustomersQuery } from './get-customers.query';

@QueryHandler(GetCustomersQuery)
export class GetCustomersHandler implements IQueryHandler<
  GetCustomersQuery,
  CustomerPageReadModel
> {
  public constructor(
    @Inject(CUSTOMERS_REPOSITORY)
    private readonly customersRepository: ICustomersRepository,

    private readonly readModelFactory: CustomerReadModelFactory,
  ) {}

  public async execute(
    query: GetCustomersQuery,
  ): Promise<CustomerPageReadModel> {
    const { page, limit, search, deleted } = query;
    const result = await this.customersRepository.findPage({
      limit,
      offset: (page - 1) * limit,
      search,
      deleted,
    });

    const details = await Promise.all(
      result.items.map((customer) => this.readModelFactory.create(customer)),
    );

    return new CustomerPageReadModel(
      details.map((detail) => CustomerListItemReadModel.fromDetail(detail)),
      result.total,
      page,
      limit,
    );
  }
}
