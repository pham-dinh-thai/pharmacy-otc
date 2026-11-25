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
import { RestoreSupplierCommand } from './restore-supplier.command';

@CommandHandler(RestoreSupplierCommand)
export class RestoreSupplierHandler implements ICommandHandler<RestoreSupplierCommand> {
  public constructor(
    @Inject(SUPPLIERS_REPOSITORY)
    private readonly suppliersRepository: ISuppliersRepository,

    private readonly commandBus: CommandBus,

    @Inject(UNIT_OF_WORK)
    private readonly unitOfWork: IUnitOfWork,
  ) {}

  public async execute(
    command: RestoreSupplierCommand,
  ): Promise<{ id: string }> {
    return this.unitOfWork.run(async () => {
      const supplier = await this.suppliersRepository.findByIdIncludingDeleted(
        command.id,
      );

      if (!supplier) {
        throw new SupplierNotFoundException(command.id);
      }

      const previousDeletedAt = supplier.getDeletedAt();

      supplier.restore();

      await this.suppliersRepository.update(supplier);

      await this.commandBus.execute(
        new RecordAuditLogCommand(
          recordAuditProps(command.headers, {
            action: 'restore',
            entityType: EntityType.SUPPLIERS,
            entityId: supplier.getId(),
            before: { deletedAt: previousDeletedAt },
            after: { deletedAt: null },
          }),
        ),
      );

      return { id: supplier.getId() };
    });
  }
}
