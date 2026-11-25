import { Inject } from '@nestjs/common';
import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  type IProductsRepository,
  PRODUCTS_REPOSITORY,
} from '../../../domain/products.repository';
import { ProductNotFoundException } from '../../../domain/exceptions/product.exceptions';
import {
  type IUnitOfWork,
  UNIT_OF_WORK,
} from '../../../../../shared/modules/unit-of-work/unit-of-work';
import { RecordAuditLogCommand } from '../../../../audit-logs/application/commands/record-audit-log/record-audit-log.command';
import { recordAuditProps } from '../../../../audit-logs/application/record-audit-log-props';
import { EntityType } from '../../../../audit-logs/domain/enums/entity-type.enum';
import { DeleteProductCommand } from './delete-product.command';

@CommandHandler(DeleteProductCommand)
export class DeleteProductHandler implements ICommandHandler<DeleteProductCommand> {
  public constructor(
    @Inject(PRODUCTS_REPOSITORY)
    private readonly productsRepository: IProductsRepository,

    private readonly commandBus: CommandBus,

    @Inject(UNIT_OF_WORK)
    private readonly unitOfWork: IUnitOfWork,
  ) {}

  public async execute(command: DeleteProductCommand): Promise<{ id: string }> {
    return this.unitOfWork.run(async () => {
      const product = await this.productsRepository.findByIdIncludingDeleted(
        command.id,
      );

      if (!product) throw new ProductNotFoundException(command.id);

      product.softDelete();
      await this.productsRepository.update(product);

      await this.commandBus.execute(
        new RecordAuditLogCommand(
          recordAuditProps(command.headers, {
            action: 'delete',
            entityType: EntityType.PRODUCTS,
            entityId: product.getId(),
            before: { deletedAt: null },
            after: { deletedAt: product.getDeletedAt() },
          }),
        ),
      );

      return { id: product.getId() };
    });
  }
}
