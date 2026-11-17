import { Command } from '@nestjs/cqrs';
import type { ActorHeaders } from '../../../../../shared/types/actor-headers';

export class UpdateDepartmentCommand extends Command<{
  id: string;
  name: string;
}> {
  public constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly headers: ActorHeaders,
  ) {
    super();
  }
}
