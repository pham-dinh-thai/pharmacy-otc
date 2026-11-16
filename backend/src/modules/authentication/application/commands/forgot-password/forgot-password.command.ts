import { Command } from '@nestjs/cqrs';

export class ForgotPasswordCommand extends Command<void> {
  public constructor(
    public readonly email: string,
    public readonly password: string,
    public readonly ip: string,
    public readonly userAgent: string,
  ) {
    super();
  }
}
