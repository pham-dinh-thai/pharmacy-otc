import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  type IProductsRepository,
  PRODUCTS_REPOSITORY,
} from '../../../domain/products.repository';
import { ProductNotFoundException } from '../../../domain/exceptions/product.exceptions';
import {
  type IUnitOfWork,
  UNIT_OF_WORK,
} from '../../../../../shared/modules/unit-of-work/unit-of-work';
import {
  type IOutboxRepository,
  OUTBOX_REPOSITORY,
} from '../../../../../shared/modules/outbox/domain/outbox.repository';
import { PRODUCT_DELETED_EVENT } from '../../../domain/events/product-deleted.event';
import { auditEventPayload } from '../../../../audit-logs/domain/events/audit-event.payload';
import { EntityType } from '../../../../audit-logs/domain/enums/entity-type.enum';
import { DeleteProductCommand } from './delete-product.command';

@CommandHandler(DeleteProductCommand)
export class DeleteProductHandler implements ICommandHandler<DeleteProductCommand> {
  public constructor(
    @Inject(PRODUCTS_REPOSITORY)
    private readonly productsRepository: IProductsRepository,

    @Inject(OUTBOX_REPOSITORY)
    private readonly outboxRepository: IOutboxRepository,

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

      await this.outboxRepository.create({
        eventType: PRODUCT_DELETED_EVENT,
        payload: auditEventPayload(command.headers, {
          entityType: EntityType.PRODUCTS,
          entityId: product.getId(),
          before: { deletedAt: null },
          after: { deletedAt: product.getDeletedAt() },
        }),
      });

      return { id: product.getId() };
    });
  }
}
