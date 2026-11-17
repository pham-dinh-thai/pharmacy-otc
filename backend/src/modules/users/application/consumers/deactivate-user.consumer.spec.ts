import { describe, expect, it, jest } from '@jest/globals';
import { CommandBus } from '@nestjs/cqrs';
import { OutboxConsumerRegistry } from '../../../../shared/modules/outbox/application/outbox-consumer.registry';
import { type OutboxEvent } from '../../../../shared/modules/outbox/domain/outbox.repository';
import {
  EMPLOYEE_RESIGNED_EVENT,
  type EmployeeResignedPayload,
} from '../../../employees/domain/events/employee-resigned.event';
import { DeactivateUserCommand } from '../commands/deactivate-user/deactivate-user.command';
import { DeactivateUserConsumer } from './deactivate-user.consumer';

const EMPLOYEE_ID = 'b3d7f2a8-7a0e-4f1c-9c1a-4d3f5e6a7b8c';
const USER_ID = '4e770b20-0ab6-494a-9bfd-e475e07c7a17';

const headers = {
  actorId: '7d0d2c55-9a9d-4c7d-9f6a-3f7f5a1b2c3d',
  actorType: 'user',
  actorLabel: 'admin@example.com',
  userIp: '127.0.0.1',
  userAgent: 'jest',
};

const payload: EmployeeResignedPayload = {
  employeeId: EMPLOYEE_ID,
  userId: USER_ID,
  headers,
};

const setup = () => {
  const execute = jest.fn<(command: DeactivateUserCommand) => Promise<void>>(
    () => Promise.resolve(),
  );
  const registry = new OutboxConsumerRegistry();
  const consumer = new DeactivateUserConsumer(registry, {
    execute,
  } as unknown as CommandBus);

  consumer.onModuleInit();

  const event: OutboxEvent = {
    id: 42,
    eventType: EMPLOYEE_RESIGNED_EVENT,
    payload,
    createdAt: new Date('2026-11-17T00:00:00.000Z'),
    processed: false,
    attempts: 0,
    lastError: null,
    failedAt: null,
  };

  return { consumer, execute, registry, event };
};

describe('DeactivateUserConsumer', () => {
  it('registers itself for the employee resigned event', () => {
    const { consumer, registry } = setup();

    expect(registry.get(EMPLOYEE_RESIGNED_EVENT)).toBe(consumer);
  });

  it('dispatches DeactivateUserCommand with the event payload', async () => {
    const { consumer, execute, event } = setup();

    await consumer.handle(event);

    expect(execute).toHaveBeenCalledTimes(1);
    expect(execute).toHaveBeenCalledWith(
      new DeactivateUserCommand(USER_ID, headers),
    );
  });
});
