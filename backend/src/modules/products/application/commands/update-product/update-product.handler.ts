import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  type IProductsRepository,
  PRODUCTS_REPOSITORY,
} from '../../../domain/products.repository';
import {
  CATEGORIES_REPOSITORY,
  type ICategoriesRepository,
} from '../../../../categories/domain/categories.repository';
import {
  ProductCategoryNotFoundException,
  ProductNotFoundException,
} from '../../../domain/exceptions/product.exceptions';
import {
  type IUnitOfWork,
  UNIT_OF_WORK,
} from '../../../../../shared/modules/unit-of-work/unit-of-work';
import {
  type IOutboxRepository,
  OUTBOX_REPOSITORY,
} from '../../../../../shared/modules/outbox/domain/outbox.repository';
import { PRODUCT_UPDATED_EVENT } from '../../../domain/events/product-updated.event';
import { auditEventPayload } from '../../../../audit-logs/domain/events/audit-event.payload';
import { EntityType } from '../../../../audit-logs/domain/enums/entity-type.enum';
import { UpdateProductCommand } from './update-product.command';

@CommandHandler(UpdateProductCommand)
export class UpdateProductHandler implements ICommandHandler<UpdateProductCommand> {
  public constructor(
    @Inject(PRODUCTS_REPOSITORY)
    private readonly productsRepository: IProductsRepository,

    @Inject(CATEGORIES_REPOSITORY)
    private readonly categoriesRepository: ICategoriesRepository,

    @Inject(OUTBOX_REPOSITORY)
    private readonly outboxRepository: IOutboxRepository,

    @Inject(UNIT_OF_WORK)
    private readonly unitOfWork: IUnitOfWork,
  ) {}

  public async execute(command: UpdateProductCommand): Promise<{ id: string }> {
    return this.unitOfWork.run(async () => {
      const product = await this.productsRepository.findById(command.id);

      if (!product) throw new ProductNotFoundException(command.id);

      const categoryIds = [...new Set(command.categoryIds)];
      const activeCategories =
        await this.categoriesRepository.findActiveByIds(categoryIds);

      if (activeCategories.length !== categoryIds.length) {
        throw new ProductCategoryNotFoundException();
      }

      const before = {
        name: product.getName(),
        unitPrice: product.getUnitPrice(),
        quantity: product.getQuantity(),
        categoryIds: [...product.getCategoryIds()],
      };

      product.update({
        name: command.name,
        unitPrice: command.unitPrice,
        quantity: command.quantity,
        categoryIds,
      });

      await this.productsRepository.update(product);

      await this.outboxRepository.create({
        eventType: PRODUCT_UPDATED_EVENT,
        payload: auditEventPayload(command.headers, {
          entityType: EntityType.PRODUCTS,
          entityId: product.getId(),
          before,
          after: {
            name: product.getName(),
            unitPrice: product.getUnitPrice(),
            quantity: product.getQuantity(),
            categoryIds: [...product.getCategoryIds()],
          },
        }),
      });

      return { id: product.getId() };
    });
  }
}
