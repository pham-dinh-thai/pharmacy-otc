import { Injectable } from '@nestjs/common';
import { StorefrontService } from '../../../storefront/application/storefront.service';
import type { StorefrontProduct } from '../../../storefront/application/storefront.read-model';
import type { ICartCatalog } from '../../application/ports/cart-catalog.port';

@Injectable()
export class StorefrontCartCatalogAdapter implements ICartCatalog {
  public constructor(private readonly storefrontService: StorefrontService) {}

  public findProduct(productId: string): Promise<StorefrontProduct | null> {
    return this.storefrontService.getProduct(productId);
  }

  public async findProducts(
    productIds: string[],
  ): Promise<Map<string, StorefrontProduct>> {
    const products = await Promise.all(
      [...new Set(productIds)].map((id) => this.findProduct(id)),
    );

    return new Map(
      products.flatMap((product) =>
        product ? [[product.id, product] as const] : [],
      ),
    );
  }
}
