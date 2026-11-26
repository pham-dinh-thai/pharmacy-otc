import { Command } from '@nestjs/cqrs';
import type { ActorHeaders } from '../../../../../shared/types/actor-headers';
import type { OrderStatus } from '../../../domain/enums/order-status.enum';

export class CancelOrderCommand extends Command<{
  id: string;
  status: OrderStatus;
}> {
  public constructor(
    public readonly orderId: string,
    public readonly userId: string,
    public readonly headers: ActorHeaders,
  ) {
    super();
  }
}
