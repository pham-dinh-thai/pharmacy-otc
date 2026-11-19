import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { RestoreCustomerCommand } from './restore-customer.command';
import {
  CustomerNotFoundException,
  CustomerNotDeletedException,
} from '../../../domain/exceptions/customer.exceptions';
import {
  CUSTOMERS_REPOSITORY,
  type ICustomersRepository,
} from '../../../domain/customers.repository';
import {
  type IOutboxRepository,
  OUTBOX_REPOSITORY,
} from '../../../../../shared/modules/outbox/domain/outbox.repository';
import {
  type IUnitOfWork,
  UNIT_OF_WORK,
} from '../../../../../shared/modules/unit-of-work/unit-of-work';
import { CUSTOMER_RESTORED_EVENT } from '../../../domain/events/customer-restored.event';
import { auditEventPayload } from '../../../../audit-logs/domain/events/audit-event.payload';
import { EntityType } from '../../../../audit-logs/domain/enums/entity-type.enum';

@CommandHandler(RestoreCustomerCommand)
export class RestoreCustomerHandler implements ICommandHandler<RestoreCustomerCommand> {
  public constructor(
    @Inject(CUSTOMERS_REPOSITORY)
    private readonly customersRepository: ICustomersRepository,

    @Inject(OUTBOX_REPOSITORY)
    private readonly outboxRepository: IOutboxRepository,

    @Inject(UNIT_OF_WORK)
    private readonly unitOfWork: IUnitOfWork,
  ) {}

  public async execute(
    command: RestoreCustomerCommand,
  ): Promise<{ id: string }> {
    return this.unitOfWork.run(async () => {
      const customer = await this.customersRepository.findByIdIncludingDeleted(
        command.id,
      );

      if (!customer) {
        throw new CustomerNotFoundException(command.id);
      }

      if (!customer.isDeleted()) {
        throw new CustomerNotDeletedException(command.id);
      }

      const deletedAt = customer.getDeletedAt();
      customer.restore();
      await this.customersRepository.update(customer);

      await this.outboxRepository.create({
        eventType: CUSTOMER_RESTORED_EVENT,
        payload: auditEventPayload(command.headers, {
          entityType: EntityType.CUSTOMERS,
          entityId: customer.getId(),
          before: { deletedAt },
          after: { deletedAt: null },
        }),
      });

      return { id: customer.getId() };
    });
  }
}
