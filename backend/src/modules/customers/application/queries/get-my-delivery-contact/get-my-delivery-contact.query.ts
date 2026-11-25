import { Query } from '@nestjs/cqrs';
import type { DeliveryContactReadModel } from '../delivery-contact.read-model';

export class GetMyDeliveryContactQuery extends Query<DeliveryContactReadModel> {
  public constructor(public readonly userId: string) {
    super();
  }
}
