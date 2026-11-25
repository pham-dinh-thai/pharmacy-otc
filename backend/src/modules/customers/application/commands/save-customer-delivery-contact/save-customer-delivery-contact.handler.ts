import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { auditEventPayload } from '../../../../audit-logs/domain/events/audit-event.payload';
import { EntityType } from '../../../../audit-logs/domain/enums/entity-type.enum';
import {
  type IOutboxRepository,
  OUTBOX_REPOSITORY,
} from '../../../../../shared/modules/outbox/domain/outbox.repository';
import {
  type IUnitOfWork,
  UNIT_OF_WORK,
} from '../../../../../shared/modules/unit-of-work/unit-of-work';
import { Customer } from '../../../domain/customer.aggregate';
import {
  CUSTOMERS_REPOSITORY,
  type ICustomersRepository,
} from '../../../domain/customers.repository';
import { CUSTOMER_CREATED_EVENT } from '../../../domain/events/customer-created.event';
import { CUSTOMER_UPDATED_EVENT } from '../../../domain/events/customer-updated.event';
import { CustomerAlreadyDeletedException } from '../../../domain/exceptions/customer.exceptions';
import { SaveCustomerDeliveryContactCommand } from './save-customer-delivery-contact.command';

const snapshot = (customer: Customer) => ({
  phones: customer.getPhones().map((phone) => phone.getPhone()),
  addresses: customer.getAddresses().map((address) => address.getAddress()),
});

@CommandHandler(SaveCustomerDeliveryContactCommand)
export class SaveCustomerDeliveryContactHandler implements ICommandHandler<SaveCustomerDeliveryContactCommand> {
  public constructor(
    @Inject(CUSTOMERS_REPOSITORY)
    private readonly customersRepository: ICustomersRepository,

    @Inject(OUTBOX_REPOSITORY)
    private readonly outboxRepository: IOutboxRepository,

    @Inject(UNIT_OF_WORK)
    private readonly unitOfWork: IUnitOfWork,
  ) {}

  public async execute(
    command: SaveCustomerDeliveryContactCommand,
  ): Promise<{ id: string }> {
    return this.unitOfWork.run(async () => {
      const existing = await this.customersRepository.findByUserId(
        command.userId,
      );
      const isNew = existing === null;
      const before = existing ? snapshot(existing) : null;

      const customer =
        existing ??
        Customer.createForDelivery({
          userId: command.userId,
          phone: command.phone,
          address: command.address,
        });

      if (existing) {
        if (existing.isDeleted()) {
          throw new CustomerAlreadyDeletedException(existing.getId());
        }

        existing.saveDeliveryContact({
          phone: command.phone,
          address: command.address,
        });
      }

      const saved = isNew
        ? await this.customersRepository.create(customer)
        : await this.customersRepository.update(customer);

      await this.outboxRepository.create({
        eventType: isNew ? CUSTOMER_CREATED_EVENT : CUSTOMER_UPDATED_EVENT,
        payload: auditEventPayload(command.headers, {
          entityType: EntityType.CUSTOMERS,
          entityId: saved.getId(),
          before,
          after: snapshot(saved),
        }),
      });

      return { id: saved.getId() };
    });
  }
}
