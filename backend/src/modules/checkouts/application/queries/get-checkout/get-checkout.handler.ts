import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
  CHECKOUTS_REPOSITORY,
  type ICheckoutRepository,
} from '../../../domain/checkouts.repository';
import { CheckoutNotFoundException } from '../../../domain/exceptions/checkout.exception';
import { CheckoutDetailReadModel } from './checkout-detail.read-model';
import { CheckoutLineReadModel } from './checkout-line.read-model';
import { GetCheckoutQuery } from './get-checkout.query';

@QueryHandler(GetCheckoutQuery)
export class GetCheckoutHandler implements IQueryHandler<
  GetCheckoutQuery,
  CheckoutDetailReadModel
> {
  public constructor(
    @Inject(CHECKOUTS_REPOSITORY)
    private readonly checkoutsRepository: ICheckoutRepository,
  ) {}

  public async execute(
    query: GetCheckoutQuery,
  ): Promise<CheckoutDetailReadModel> {
    const checkout = await this.checkoutsRepository.findById(query.id);

    if (!checkout || checkout.getUserId() !== query.headers.actorId) {
      throw new CheckoutNotFoundException(query.id);
    }

    return new CheckoutDetailReadModel(
      checkout.getId(),
      checkout.getStatus(),
      checkout.getShippingName(),
      checkout.getShippingAddress(),
      checkout.getShippingPhone(),
      checkout.getAmount().toString(),
      checkout.getExpiresAt(),
      checkout.getCreatedAt(),
      checkout
        .getLines()
        .map(
          (line) =>
            new CheckoutLineReadModel(
              line.getProductId(),
              line.getProductName(),
              line.getProductSku(),
              line.getUnitPrice().toString(),
              line.getQuantity(),
              line.getTotal().toBigInt().toString(),
            ),
        ),
    );
  }
}
