import { Product } from '../../domain/product.aggregate';
import { MikroProduct } from '../entities/mikro-product.entity';

export class ProductMapper {
  public static toDomain(
    mikroProduct: MikroProduct,
    categoryIds: string[] = [],
  ): Product {
    return Product.fromPersistent({
      id: mikroProduct.id,
      name: mikroProduct.name,
      unitPrice: mikroProduct.unitPrice.toString(),
      quantity: mikroProduct.quantity,
      sku: mikroProduct.sku,
      unit: mikroProduct.unit,
      description: mikroProduct.description,
      imageUrl: mikroProduct.imageUrl,
      expiryDate: ProductMapper.toDateString(mikroProduct.expiryDate),
      warning: mikroProduct.warning,
      categoryIds,
      deletedAt: mikroProduct.deletedAt,
      createdAt: mikroProduct.createdAt,
      updatedAt: mikroProduct.updatedAt,
    });
  }

  public static assign(
    mikroProduct: MikroProduct,
    product: Product,
  ): MikroProduct {
    mikroProduct.id = product.getId();
    mikroProduct.name = product.getName();
    mikroProduct.unitPrice = BigInt(product.getUnitPrice());
    mikroProduct.quantity = product.getQuantity();
    mikroProduct.sku = product.getSku();
    mikroProduct.unit = product.getUnit();
    mikroProduct.description = product.getDescription();
    mikroProduct.imageUrl = product.getImageUrl();
    mikroProduct.expiryDate = ProductMapper.toDate(product.getExpiryDate());
    mikroProduct.warning = product.getWarning();
    mikroProduct.deletedAt = product.getDeletedAt();
    mikroProduct.createdAt = product.getCreatedAt();
    mikroProduct.updatedAt = product.getUpdatedAt();

    return mikroProduct;
  }

  private static toDateString(value: Date | string | null): string | null {
    if (!value) return null;

    return value instanceof Date ? value.toISOString().slice(0, 10) : value;
  }

  private static toDate(value: string | null): Date | null {
    return value ? new Date(`${value}T00:00:00.000Z`) : null;
  }
}
