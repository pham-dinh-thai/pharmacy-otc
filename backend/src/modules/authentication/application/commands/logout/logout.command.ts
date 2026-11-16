import { Command } from '@nestjs/cqrs';

export class LogoutCommand extends Command<void> {
  public constructor(public readonly refreshToken: string) {
    super();
  }
}
