import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateCustomerByAdminCommand } from './create-customer-by-admin.command';
import { CreateUserService } from '../../../../users/application/services/create-user.service';
import {
  ACCOUNTS_REPOSITORY,
  type IAccountsRepository,
} from '../../../../authentication/domain/accounts.repository';
import { Account } from '../../../../authentication/domain/account.aggregate';
import { Customer } from '../../../domain/customer.aggregate';
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
import { USER_CREATED_EVENT } from '../../../../users/domain/events/user-created.event';
import { ACCOUNT_SIGNED_UP_EVENT } from '../../../../authentication/domain/events/account-signed-up.event';
import { CUSTOMER_CREATED_EVENT } from '../../../domain/events/customer-created.event';
import { auditEventPayload } from '../../../../audit-logs/domain/events/audit-event.payload';
import { EntityType } from '../../../../audit-logs/domain/enums/entity-type.enum';

@CommandHandler(CreateCustomerByAdminCommand)
export class CreateCustomerByAdminHandler implements ICommandHandler<CreateCustomerByAdminCommand> {
  public constructor(
    private readonly createUserService: CreateUserService,

    @Inject(ACCOUNTS_REPOSITORY)
    private readonly accountsRepository: IAccountsRepository,

    @Inject(CUSTOMERS_REPOSITORY)
    private readonly customersRepository: ICustomersRepository,

    @Inject(OUTBOX_REPOSITORY)
    private readonly outboxRepository: IOutboxRepository,

    @Inject(UNIT_OF_WORK)
    private readonly unitOfWork: IUnitOfWork,
  ) {}

  public async execute(
    command: CreateCustomerByAdminCommand,
  ): Promise<{ id: string }> {
    return this.unitOfWork.run(async () => {
      const user = await this.createUserService.create({
        firstName: command.firstName,
        lastName: command.lastName,
        email: command.email,
      });

      const account = await Account.create({
        userId: user.getId(),
        password: command.password,
        mustChangePassword: true,
      });
      this.accountsRepository.create(account);

      const customer = Customer.create({
        userId: user.getId(),
        ...command.profile,
      });
      await this.customersRepository.create(customer);

      await this.outboxRepository.create({
        eventType: USER_CREATED_EVENT,
        payload: auditEventPayload(command.headers, {
          entityType: EntityType.USERS,
          entityId: user.getId(),
          after: {
            firstName: user.getFirstName(),
            lastName: user.getLastName(),
            email: user.getEmail(),
            roleIds: user.getRoleIds(),
          },
        }),
      });

      await this.outboxRepository.create({
        eventType: ACCOUNT_SIGNED_UP_EVENT,
        payload: auditEventPayload(command.headers, {
          entityType: EntityType.ACCOUNTS,
          entityId: account.getId(),
          after: {
            accountId: account.getId(),
            userId: account.getUserId(),
          },
        }),
      });

      await this.outboxRepository.create({
        eventType: CUSTOMER_CREATED_EVENT,
        payload: auditEventPayload(command.headers, {
          entityType: EntityType.CUSTOMERS,
          entityId: customer.getId(),
          after: {
            userId: customer.getUserId(),
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
