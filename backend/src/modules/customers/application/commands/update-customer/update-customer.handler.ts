import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UpdateCustomerCommand } from './update-customer.command';
import {
  CustomerAlreadyDeletedException,
  CustomerNotFoundException,
} from '../../../domain/exceptions/customer.exceptions';
import {
  CUSTOMERS_REPOSITORY,
  type ICustomersRepository,
} from '../../../domain/customers.repository';
import {
  USERS_REPOSITORY,
  type IUsersRepository,
} from '../../../../users/domain/users.repository';
import { UserByIdNotFoundException } from '../../../../users/domain/exceptions/user.exceptions';
import { UserEmailAlreadyExistsException } from '../../../../users/domain/exceptions/user.exceptions';
import {
  type IOutboxRepository,
  OUTBOX_REPOSITORY,
} from '../../../../../shared/modules/outbox/domain/outbox.repository';
import {
  type IUnitOfWork,
  UNIT_OF_WORK,
} from '../../../../../shared/modules/unit-of-work/unit-of-work';
import { CUSTOMER_UPDATED_EVENT } from '../../../domain/events/customer-updated.event';
import { auditEventPayload } from '../../../../audit-logs/domain/events/audit-event.payload';
import { EntityType } from '../../../../audit-logs/domain/enums/entity-type.enum';

@CommandHandler(UpdateCustomerCommand)
export class UpdateCustomerHandler implements ICommandHandler<UpdateCustomerCommand> {
  public constructor(
    @Inject(CUSTOMERS_REPOSITORY)
    private readonly customersRepository: ICustomersRepository,

    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: IUsersRepository,

    @Inject(OUTBOX_REPOSITORY)
    private readonly outboxRepository: IOutboxRepository,

    @Inject(UNIT_OF_WORK)
    private readonly unitOfWork: IUnitOfWork,
  ) {}

  public async execute(
    command: UpdateCustomerCommand,
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

      const user = await this.usersRepository.findById(customer.getUserId());

      if (!user) {
        throw new UserByIdNotFoundException(customer.getUserId());
      }

      if (
        command.email !== user.getEmail() &&
        (await this.usersRepository.existsByEmail(command.email))
      ) {
        throw new UserEmailAlreadyExistsException(command.email);
      }

      const before = {
        firstName: user.getFirstName(),
        lastName: user.getLastName(),
        email: user.getEmail(),
        phones: customer.getPhones().map((phone) => phone.getPhone()),
        addresses: customer
          .getAddresses()
          .map((address) => address.getAddress()),
      };

      user.updateProfile({
        firstName: command.firstName,
        lastName: command.lastName,
        email: command.email,
      });
      await this.usersRepository.update(user);

      customer.update(command.profile);
      await this.customersRepository.update(customer);

      await this.outboxRepository.create({
        eventType: CUSTOMER_UPDATED_EVENT,
        payload: auditEventPayload(command.headers, {
          entityType: EntityType.CUSTOMERS,
          entityId: customer.getId(),
          before,
          after: {
            firstName: user.getFirstName(),
            lastName: user.getLastName(),
            email: user.getEmail(),
            phones: customer.getPhones().map((phone) => phone.getPhone()),
            addresses: customer
              .getAddresses()
              .map((address) => address.getAddress()),
          },
        }),
      });

      return { id: customer.getId() };
    });
  }
}
