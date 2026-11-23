import { Inject, Injectable } from '@nestjs/common';
import type { CheckoutProductSnapshot } from '../../application/ports/checkout-catalog.port';
import { ICheckoutCatalog } from '../../application/ports/checkout-catalog.port';
import { PRODUCTS_REPOSITORY } from '../../../products/domain/products.repository';
import type { IProductsRepository } from '../../../products/domain/products.repository';

@Injectable()
export class ProductsCheckoutCatalogAdapter implements ICheckoutCatalog {
  public constructor(
    @Inject(PRODUCTS_REPOSITORY)
    private readonly productsRepository: IProductsRepository,
  ) {}

  public async findByIds(
    productIds: string[],
  ): Promise<Map<string, CheckoutProductSnapshot>> {
    const products = await Promise.all(
      [...new Set(productIds)].map((id) =>
        this.productsRepository.findById(id),
      ),
    );

    return new Map(
      products.flatMap((product) => {
        if (!product) return [];

        return [
          [
            product.getId(),
            {
              productId: product.getId(),
              name: product.getName(),
              sku: product.getSku(),
              unitPrice: BigInt(product.getUnitPrice()),
            } satisfies CheckoutProductSnapshot,
          ] as const,
        ];
      }),
    );
  }
}
