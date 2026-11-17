import { Command } from '@nestjs/cqrs';
import type { ActorHeaders } from '../../../../../shared/types/actor-headers';

export class CreateDepartmentCommand extends Command<{ id: string }> {
  public constructor(
    public readonly name: string,
    public readonly headers: ActorHeaders,
  ) {
    super();
  }
}
