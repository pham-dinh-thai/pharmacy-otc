import { Inject } from '@nestjs/common';
import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { SupplierNotFoundException } from '../../../domain/exceptions/supplier.exceptions';
import {
  type ISuppliersRepository,
  SUPPLIERS_REPOSITORY,
} from '../../../domain/suppliers.repository';
import { RecordAuditLogCommand } from '../../../../audit-logs/application/commands/record-audit-log/record-audit-log.command';
import { recordAuditProps } from '../../../../audit-logs/application/record-audit-log-props';
import {
  type IUnitOfWork,
  UNIT_OF_WORK,
} from '../../../../../shared/modules/unit-of-work/unit-of-work';
import { EntityType } from '../../../../audit-logs/domain/enums/entity-type.enum';
import { DeleteSupplierCommand } from './delete-supplier.command';

@CommandHandler(DeleteSupplierCommand)
export class DeleteSupplierHandler implements ICommandHandler<DeleteSupplierCommand> {
  public constructor(
    @Inject(SUPPLIERS_REPOSITORY)
    private readonly suppliersRepository: ISuppliersRepository,

    private readonly commandBus: CommandBus,

    @Inject(UNIT_OF_WORK)
    private readonly unitOfWork: IUnitOfWork,
  ) {}

  public async execute(
    command: DeleteSupplierCommand,
  ): Promise<{ id: string }> {
    return this.unitOfWork.run(async () => {
      const supplier = await this.suppliersRepository.findByIdIncludingDeleted(
        command.id,
      );

      if (!supplier) {
        throw new SupplierNotFoundException(command.id);
      }

      supplier.softDelete();

      await this.suppliersRepository.update(supplier);

      await this.commandBus.execute(
        new RecordAuditLogCommand(
          recordAuditProps(command.headers, {
            action: 'delete',
            entityType: EntityType.SUPPLIERS,
            entityId: supplier.getId(),
            before: { deletedAt: null },
            after: { deletedAt: supplier.getDeletedAt() },
          }),
        ),
      );

      return { id: supplier.getId() };
    });
  }
}
