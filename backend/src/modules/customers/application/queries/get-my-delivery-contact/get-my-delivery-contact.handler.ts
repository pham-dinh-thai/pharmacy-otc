import { Inject } from '@nestjs/common';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import {
  CUSTOMERS_REPOSITORY,
  type ICustomersRepository,
} from '../../../domain/customers.repository';
import type { DeliveryContactReadModel } from '../delivery-contact.read-model';
import { GetMyDeliveryContactQuery } from './get-my-delivery-contact.query';

@QueryHandler(GetMyDeliveryContactQuery)
export class GetMyDeliveryContactHandler implements IQueryHandler<
  GetMyDeliveryContactQuery,
  DeliveryContactReadModel
> {
  public constructor(
    @Inject(CUSTOMERS_REPOSITORY)
    private readonly customersRepository: ICustomersRepository,
  ) {}

  public async execute(
    query: GetMyDeliveryContactQuery,
  ): Promise<DeliveryContactReadModel> {
    const customer = await this.customersRepository.findByUserId(query.userId);

    if (!customer) return { phone: null, address: null };

    return {
      phone:
        customer
          .getPhones()
          .find((phone) => phone.getIsPrimary())
          ?.getPhone() ??
        customer.getPhones()[0]?.getPhone() ??
        null,
      address:
        customer
          .getAddresses()
          .find((address) => address.getIsDefault())
          ?.getAddress() ??
        customer.getAddresses()[0]?.getAddress() ??
        null,
    };
  }
}
