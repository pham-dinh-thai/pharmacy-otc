import type { StorefrontProduct } from '../../storefront/application/storefront.read-model';

export class CartItemReadModel {
  public constructor(
    public readonly product: StorefrontProduct,
    public readonly quantity: number,
    public readonly lineTotal: string,
  ) {}
}

export class CartReadModel {
  public constructor(
    public readonly kind: 'guest' | 'user',
    public readonly items: CartItemReadModel[],
    public readonly totalItems: number,
    public readonly subtotal: string,
    public readonly shippingFee: string,
    public readonly total: string,
  ) {}
}
