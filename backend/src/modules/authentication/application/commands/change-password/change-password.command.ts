import { Command } from '@nestjs/cqrs';
import { ActorHeaders } from '../../../../../shared/types/actor-headers';

export class ChangePasswordCommand extends Command<void> {
  public constructor(
    public readonly currentPassword: string,
    public readonly newPassword: string,
    public readonly newPasswordConfirmation: string,
    public readonly headers: ActorHeaders,
  ) {
    super();
  }
}
