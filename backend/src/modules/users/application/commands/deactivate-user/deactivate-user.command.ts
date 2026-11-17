import { Command } from '@nestjs/cqrs';
import type { ActorHeaders } from '../../../../../shared/types/actor-headers';

export class DeactivateUserCommand extends Command<{ userId: string }> {
  public constructor(
    public readonly userId: string,
    public readonly headers: ActorHeaders,
  ) {
    super();
  }
}
