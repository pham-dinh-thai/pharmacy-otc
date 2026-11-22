import type { StorefrontProduct } from '../../../storefront/application/storefront.read-model';

export interface ICartCatalog {
  findProduct(productId: string): Promise<StorefrontProduct | null>;

  findProducts(productIds: string[]): Promise<Map<string, StorefrontProduct>>;
}

export const CART_CATALOG = 'ICartCatalog';
