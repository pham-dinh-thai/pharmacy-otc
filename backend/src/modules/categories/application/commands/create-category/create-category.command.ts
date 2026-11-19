import { Command } from '@nestjs/cqrs';
import { type ActorHeaders } from '../../../../../shared/types/actor-headers';

export class CreateCategoryCommand extends Command<{ id: string }> {
  public constructor(
    public readonly name: string,
    public readonly slug: string | null,
    public readonly description: string | null,
    public readonly headers: ActorHeaders,
  ) {
    super();
  }
}
