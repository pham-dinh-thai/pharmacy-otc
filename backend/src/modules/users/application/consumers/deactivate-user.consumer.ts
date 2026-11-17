import { Injectable, OnModuleInit } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { OutboxConsumerRegistry } from '../../../../shared/modules/outbox/application/outbox-consumer.registry';
import { type OutboxConsumer } from '../../../../shared/modules/outbox/domain/outbox-consumer';
import { type OutboxEvent } from '../../../../shared/modules/outbox/domain/outbox.repository';
import {
  EMPLOYEE_RESIGNED_EVENT,
  type EmployeeResignedPayload,
} from '../../../employees/domain/events/employee-resigned.event';
import { DeactivateUserCommand } from '../commands/deactivate-user/deactivate-user.command';

/**
 * The relay already wraps handle() and markProcessed() in one unit of work.
 * DeactivateUserHandler opens a nested transaction, so the account update,
 * its audit event and the processed flag commit together.
 */
@Injectable()
export class DeactivateUserConsumer implements OutboxConsumer, OnModuleInit {
  public constructor(
    private readonly registry: OutboxConsumerRegistry,
    private readonly commandBus: CommandBus,
  ) {}

  public onModuleInit(): void {
    this.registry.register(EMPLOYEE_RESIGNED_EVENT, this);
  }

  public async handle(event: OutboxEvent): Promise<void> {
    const payload = event.payload as unknown as EmployeeResignedPayload;

    await this.commandBus.execute(
      new DeactivateUserCommand(payload.userId, payload.headers),
    );
  }
}
