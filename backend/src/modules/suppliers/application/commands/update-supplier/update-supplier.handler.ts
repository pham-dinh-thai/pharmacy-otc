import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UpdateSupplierCommand } from './update-supplier.command';
import {
  type ISuppliersRepository,
  SUPPLIERS_REPOSITORY,
} from '../../../domain/suppliers.repository';
import { Inject } from '@nestjs/common';
import { SupplierNotFoundException } from '../../../domain/exceptions/supplier.exceptions';
import { UpdateSupplierResponse } from './update-supplier.response';
import {
  type IUnitOfWork,
  UNIT_OF_WORK,
} from '../../../../../shared/modules/unit-of-work/unit-of-work';
import { RecordAuditLogCommand } from '../../../../audit-logs/application/commands/record-audit-log/record-audit-log.command';
import { recordAuditProps } from '../../../../audit-logs/application/record-audit-log-props';
import { EntityType } from '../../../../audit-logs/domain/enums/entity-type.enum';

@CommandHandler(UpdateSupplierCommand)
export class UpdateSupplierHandler implements ICommandHandler<UpdateSupplierCommand> {
  public constructor(
    @Inject(SUPPLIERS_REPOSITORY)
    private readonly suppliersRepository: ISuppliersRepository,

    private readonly commandBus: CommandBus,

    @Inject(UNIT_OF_WORK)
    private readonly unitOfWork: IUnitOfWork,
  ) {}

  public async execute(
    command: UpdateSupplierCommand,
  ): Promise<UpdateSupplierResponse> {
    return this.unitOfWork.run(async () => {
      const supplier = await this.suppliersRepository.findById(command.id);

      if (!supplier) {
        throw new SupplierNotFoundException(command.id);
      }

      const before = {
        name: supplier.getName(),
        phone: supplier.getPhone(),
        email: supplier.getEmail(),
        address: supplier.getAddress(),
        taxCode: supplier.getTaxCode(),
      };

      supplier.update({
        name: command.name,
        phone: command.phone,
        email: command.email,
        address: command.address,
        taxCode: command.taxCode,
      });

      const result = await this.suppliersRepository.update(supplier);

      await this.commandBus.execute(
        new RecordAuditLogCommand(
          recordAuditProps(command.headers, {
            action: 'update',
            entityType: EntityType.SUPPLIERS,
            entityId: result.getId(),
            before,
            after: {
              name: result.getName(),
              phone: result.getPhone(),
              email: result.getEmail(),
              address: result.getAddress(),
              taxCode: result.getTaxCode(),
            },
          }),
        ),
      );

      return new UpdateSupplierResponse(
        result.getId(),
        result.getName(),
        result.getPhone(),
        result.getEmail(),
        result.getAddress(),
        result.getTaxCode(),
      );
    });
  }
}
