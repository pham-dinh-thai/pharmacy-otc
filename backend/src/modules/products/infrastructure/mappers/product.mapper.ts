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
    mikroProduct.deletedAt = product.getDeletedAt();
    mikroProduct.createdAt = product.getCreatedAt();
    mikroProduct.updatedAt = product.getUpdatedAt();

    return mikroProduct;
  }
}
