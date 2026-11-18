import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { SupplierNotFoundException } from '../../../domain/exceptions/supplier.exceptions';
import {
  type ISuppliersRepository,
  SUPPLIERS_REPOSITORY,
} from '../../../domain/suppliers.repository';
import {
  type IOutboxRepository,
  OUTBOX_REPOSITORY,
} from '../../../../../shared/modules/outbox/domain/outbox.repository';
import {
  type IUnitOfWork,
  UNIT_OF_WORK,
} from '../../../../../shared/modules/unit-of-work/unit-of-work';
import { SUPPLIER_RESTORED_EVENT } from '../../../domain/events/supplier-restored.event';
import { auditEventPayload } from '../../../../audit-logs/domain/events/audit-event.payload';
import { EntityType } from '../../../../audit-logs/domain/enums/entity-type.enum';
import { RestoreSupplierCommand } from './restore-supplier.command';

@CommandHandler(RestoreSupplierCommand)
export class RestoreSupplierHandler implements ICommandHandler<RestoreSupplierCommand> {
  public constructor(
    @Inject(SUPPLIERS_REPOSITORY)
    private readonly suppliersRepository: ISuppliersRepository,

    @Inject(OUTBOX_REPOSITORY)
    private readonly outboxRepository: IOutboxRepository,

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

      await this.outboxRepository.create({
        eventType: SUPPLIER_RESTORED_EVENT,
        payload: auditEventPayload(command.headers, {
          entityType: EntityType.SUPPLIERS,
          entityId: supplier.getId(),
          before: { deletedAt: previousDeletedAt },
          after: { deletedAt: null },
        }),
      });

      return { id: supplier.getId() };
    });
  }
}
