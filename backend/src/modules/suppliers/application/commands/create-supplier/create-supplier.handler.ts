import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateSupplierCommand } from './create-supplier.command';
import { Inject } from '@nestjs/common';
import {
  type ISuppliersRepository,
  SUPPLIERS_REPOSITORY,
} from '../../../domain/suppliers.repository';
import { Supplier } from '../../../domain/supplier.aggregate';
import {
  type IUnitOfWork,
  UNIT_OF_WORK,
} from '../../../../../shared/modules/unit-of-work/unit-of-work';
import { RecordAuditLogCommand } from '../../../../audit-logs/application/commands/record-audit-log/record-audit-log.command';
import { recordAuditProps } from '../../../../audit-logs/application/record-audit-log-props';
import { EntityType } from '../../../../audit-logs/domain/enums/entity-type.enum';

@CommandHandler(CreateSupplierCommand)
export class CreateSupplierHandler implements ICommandHandler<CreateSupplierCommand> {
  public constructor(
    @Inject(SUPPLIERS_REPOSITORY)
    private readonly suppliersRepository: ISuppliersRepository,

    private readonly commandBus: CommandBus,

    @Inject(UNIT_OF_WORK)
    private readonly unitOfWork: IUnitOfWork,
  ) {}

  public execute(command: CreateSupplierCommand): Promise<{ id: string }> {
    return this.unitOfWork.run(async () => {
      const sequence = await this.suppliersRepository.nextSequence();

      const supplier = Supplier.create({
        sequence,
        name: command.name,
        phone: command.phone,
        email: command.email,
        address: command.address,
        taxCode: command.taxCode,
      });

      await this.suppliersRepository.create(supplier);

      await this.commandBus.execute(
        new RecordAuditLogCommand(
          recordAuditProps(command.headers, {
            action: 'create',
            entityType: EntityType.SUPPLIERS,
            entityId: supplier.getId(),
            after: {
              code: supplier.getCode(),
              name: supplier.getName(),
              phone: supplier.getPhone(),
              email: supplier.getEmail(),
              address: supplier.getAddress(),
              taxCode: supplier.getTaxCode(),
            },
          }),
        ),
      );

      return { id: supplier.getId() };
    });
  }
}
