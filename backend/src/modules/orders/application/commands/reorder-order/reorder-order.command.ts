import { Command } from '@nestjs/cqrs';

export class ReorderOrderCommand extends Command<{
  id: string;
  totalItems: number;
}> {
  public constructor(
    public readonly orderId: string,
    public readonly userId: string,
  ) {
    super();
  }
}
