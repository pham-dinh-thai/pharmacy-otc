import { Command } from '@nestjs/cqrs';
import { type ActorHeaders } from '../../../../../shared/types/actor-headers';

export class CreateEmployeeCommand extends Command<{ id: string }> {
  public constructor(
    public readonly firstName: string,
    public readonly lastName: string,
    public readonly email: string,
    public readonly password: string,
    public readonly departmentId: string,
    public readonly position: string | null,
    public readonly headers: ActorHeaders,
  ) {
    super();
  }
}
