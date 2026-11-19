import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DeleteCustomerCommand } from './delete-customer.command';
import {
  CustomerAlreadyDeletedException,
  CustomerNotFoundException,
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
import { CUSTOMER_DELETED_EVENT } from '../../../domain/events/customer-deleted.event';
import { auditEventPayload } from '../../../../audit-logs/domain/events/audit-event.payload';
import { EntityType } from '../../../../audit-logs/domain/enums/entity-type.enum';

@CommandHandler(DeleteCustomerCommand)
export class DeleteCustomerHandler implements ICommandHandler<DeleteCustomerCommand> {
  public constructor(
    @Inject(CUSTOMERS_REPOSITORY)
    private readonly customersRepository: ICustomersRepository,

    @Inject(OUTBOX_REPOSITORY)
    private readonly outboxRepository: IOutboxRepository,

    @Inject(UNIT_OF_WORK)
    private readonly unitOfWork: IUnitOfWork,
  ) {}

  public async execute(
    command: DeleteCustomerCommand,
  ): Promise<{ id: string }> {
    return this.unitOfWork.run(async () => {
      const customer = await this.customersRepository.findByIdIncludingDeleted(
        command.id,
      );

      if (!customer) {
        throw new CustomerNotFoundException(command.id);
      }

      if (customer.isDeleted()) {
        throw new CustomerAlreadyDeletedException(command.id);
      }

      customer.softDelete();
      await this.customersRepository.update(customer);

      await this.outboxRepository.create({
        eventType: CUSTOMER_DELETED_EVENT,
        payload: auditEventPayload(command.headers, {
          entityType: EntityType.CUSTOMERS,
          entityId: customer.getId(),
          before: { deletedAt: null },
          after: { deletedAt: customer.getDeletedAt() },
        }),
      });

      return { id: customer.getId() };
    });
  }
}
