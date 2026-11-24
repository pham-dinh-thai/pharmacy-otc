import { Command } from '@nestjs/cqrs';
import type { ActorHeaders } from '../../../../../shared/types/actor-headers';

export class SaveCustomerDeliveryContactCommand extends Command<{
  id: string;
}> {
  public constructor(
    public readonly userId: string,
    public readonly phone: string | null,
    public readonly address: string | null,
    public readonly headers: ActorHeaders,
  ) {
    super();
  }
}
