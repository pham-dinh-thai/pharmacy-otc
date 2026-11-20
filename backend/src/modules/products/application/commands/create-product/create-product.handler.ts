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
  ProductSkuAlreadyExistsException,
} from '../../../domain/exceptions/product.exceptions';
import {
  normalizeProductSku,
  Product,
} from '../../../domain/product.aggregate';
import {
  type IUnitOfWork,
  UNIT_OF_WORK,
} from '../../../../../shared/modules/unit-of-work/unit-of-work';
import {
  type IOutboxRepository,
  OUTBOX_REPOSITORY,
} from '../../../../../shared/modules/outbox/domain/outbox.repository';
import { PRODUCT_CREATED_EVENT } from '../../../domain/events/product-created.event';
import { auditEventPayload } from '../../../../audit-logs/domain/events/audit-event.payload';
import { EntityType } from '../../../../audit-logs/domain/enums/entity-type.enum';
import { CreateProductCommand } from './create-product.command';

@CommandHandler(CreateProductCommand)
export class CreateProductHandler implements ICommandHandler<CreateProductCommand> {
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

  public async execute(command: CreateProductCommand): Promise<{ id: string }> {
    return this.unitOfWork.run(async () => {
      const categoryIds = [...new Set(command.categoryIds)];
      const activeCategories =
        await this.categoriesRepository.findActiveByIds(categoryIds);

      if (activeCategories.length !== categoryIds.length) {
        throw new ProductCategoryNotFoundException();
      }

      const sku = normalizeProductSku(command.details.sku);

      if (sku && (await this.productsRepository.existsBySku(sku))) {
        throw new ProductSkuAlreadyExistsException(sku);
      }

      const product = Product.create({
        name: command.name,
        unitPrice: command.unitPrice,
        categoryIds,
        ...command.details,
      });

      await this.productsRepository.create(product);

      await this.outboxRepository.create({
        eventType: PRODUCT_CREATED_EVENT,
        payload: auditEventPayload(command.headers, {
          entityType: EntityType.PRODUCTS,
          entityId: product.getId(),
          after: {
            name: product.getName(),
            unitPrice: product.getUnitPrice(),
            sku: product.getSku(),
            unit: product.getUnit(),
            description: product.getDescription(),
            imageUrl: product.getImageUrl(),
            expiryDate: product.getExpiryDate(),
            warning: product.getWarning(),
            categoryIds: [...product.getCategoryIds()],
          },
        }),
      });

      return { id: product.getId() };
    });
  }
}
