import { Inject } from '@nestjs/common';
import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
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
  type IUnitOfWork,
  UNIT_OF_WORK,
} from '../../../../../shared/modules/unit-of-work/unit-of-work';
import { RecordAuditLogCommand } from '../../../../audit-logs/application/commands/record-audit-log/record-audit-log.command';
import { recordAuditProps } from '../../../../audit-logs/application/record-audit-log-props';
import { EntityType } from '../../../../audit-logs/domain/enums/entity-type.enum';

@CommandHandler(DeleteCustomerCommand)
export class DeleteCustomerHandler implements ICommandHandler<DeleteCustomerCommand> {
  public constructor(
    @Inject(CUSTOMERS_REPOSITORY)
    private readonly customersRepository: ICustomersRepository,

    private readonly commandBus: CommandBus,

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

      await this.commandBus.execute(
        new RecordAuditLogCommand(
          recordAuditProps(command.headers, {
            action: 'delete',
            entityType: EntityType.CUSTOMERS,
            entityId: customer.getId(),
            before: { deletedAt: null },
            after: { deletedAt: customer.getDeletedAt() },
          }),
        ),
      );

      return { id: customer.getId() };
    });
  }
}
