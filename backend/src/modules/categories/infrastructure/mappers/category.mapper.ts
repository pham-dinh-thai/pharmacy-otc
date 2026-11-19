import { Category } from '../../domain/category.aggregate';
import { MikroCategory } from '../entities/mikro-category.entity';

export class CategoryMapper {
  public static toDomain(
    mikroCategory: MikroCategory,
    productIds: string[] = [],
  ): Category {
    return Category.fromPersistent({
      id: mikroCategory.id,
      name: mikroCategory.name,
      slug: mikroCategory.slug,
      description: mikroCategory.description,
      productIds,
      deletedAt: mikroCategory.deletedAt,
      createdAt: mikroCategory.createdAt,
      updatedAt: mikroCategory.updatedAt,
    });
  }

  public static toMikro(category: Category): MikroCategory {
    return CategoryMapper.assign(new MikroCategory(), category);
  }

  public static assign(
    mikroCategory: MikroCategory,
    category: Category,
  ): MikroCategory {
    mikroCategory.id = category.getId();
    mikroCategory.name = category.getName();
    mikroCategory.slug = category.getSlug();
    mikroCategory.description = category.getDescription();
    mikroCategory.deletedAt = category.getDeletedAt();
    mikroCategory.createdAt = category.getCreatedAt();
    mikroCategory.updatedAt = category.getUpdatedAt();

    return mikroCategory;
  }
}
