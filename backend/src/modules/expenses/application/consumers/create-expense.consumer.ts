import { Injectable, OnModuleInit } from '@nestjs/common';
import { OutboxConsumer } from '../../../../shared/modules/outbox/domain/outbox-consumer';
import { CommandBus } from '@nestjs/cqrs';
import { OutboxConsumerRegistry } from '../../../../shared/modules/outbox/application/outbox-consumer.registry';
import { OutboxEvent } from '../../../../shared/modules/outbox/domain/outbox.repository';
import { CreateExpenseCommand } from '../commands/create-expense/create-expense.command';
import {
  GOODS_RECEIPT_CONFIRMED_EXPENSE,
  type GoodsReceiptConfirmedExpensePayload,
} from '../../../goods-receipts/domain/events/goods-receipt-confirmed.event';
import {
  SYSTEM_ACTOR_ID,
  systemActorHeaders,
} from '../../../../shared/types/actor-headers';

const CREATE_EXPENSE_EVENT_TYPE = [GOODS_RECEIPT_CONFIRMED_EXPENSE];

@Injectable()
export class CreateExpenseConsumer implements OutboxConsumer, OnModuleInit {
  public constructor(
    private readonly registry: OutboxConsumerRegistry,
    private readonly commandBus: CommandBus,
  ) {}

  public onModuleInit(): void {
    for (const eventType of CREATE_EXPENSE_EVENT_TYPE) {
      this.registry.register(eventType, this);
    }
  }

  public async handle(event: OutboxEvent): Promise<void> {
    const payload =
      event.payload as unknown as GoodsReceiptConfirmedExpensePayload;

    await this.commandBus.execute(
      new CreateExpenseCommand(
        payload.name,
        payload.category,
        BigInt(payload.amount),
        new Date(payload.expenseDate),
        payload.supplierId,
        payload.paymentMethod,
        payload.note,
        SYSTEM_ACTOR_ID,
        systemActorHeaders(),
      ),
    );
  }
}
