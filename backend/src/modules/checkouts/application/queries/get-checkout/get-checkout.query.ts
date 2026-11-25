import { Query } from '@nestjs/cqrs';
import type { ActorHeaders } from '../../../../../shared/types/actor-headers';
import type { CheckoutDetailReadModel } from './checkout-detail.read-model';

export class GetCheckoutQuery extends Query<CheckoutDetailReadModel> {
  public constructor(
    public readonly id: string,
    public readonly headers: ActorHeaders,
  ) {
    super();
  }
}
