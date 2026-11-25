import { Inject } from '@nestjs/common';
import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
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
import { RecordAuditLogCommand } from '../../../../audit-logs/application/commands/record-audit-log/record-audit-log.command';
import { recordAuditProps } from '../../../../audit-logs/application/record-audit-log-props';
import { EntityType } from '../../../../audit-logs/domain/enums/entity-type.enum';
import { CreateProductCommand } from './create-product.command';

@CommandHandler(CreateProductCommand)
export class CreateProductHandler implements ICommandHandler<CreateProductCommand> {
  public constructor(
    @Inject(PRODUCTS_REPOSITORY)
    private readonly productsRepository: IProductsRepository,

    @Inject(CATEGORIES_REPOSITORY)
    private readonly categoriesRepository: ICategoriesRepository,

    private readonly commandBus: CommandBus,

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

      await this.commandBus.execute(
        new RecordAuditLogCommand(
          recordAuditProps(command.headers, {
            action: 'create',
            entityType: EntityType.PRODUCTS,
            entityId: product.getId(),
            after: {
              name: product.getName(),
              unitPrice: product.getUnitPrice(),
              sku: product.getSku(),
              unit: product.getUnit(),
              description: product.getDescription(),
              imageUrl: product.getImageUrl(),
              warning: product.getWarning(),
              categoryIds: [...product.getCategoryIds()],
            },
          }),
        ),
      );

      return { id: product.getId() };
    });
  }
}
