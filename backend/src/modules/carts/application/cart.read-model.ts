import type { StorefrontProduct } from '../../storefront/application/storefront.read-model';

export type CartItemReadModel = {
  product: StorefrontProduct;
  quantity: number;
  lineTotal: string;
};

export type CartReadModel = {
  kind: 'guest' | 'user';
  items: CartItemReadModel[];
  totalItems: number;
  subtotal: string;
  shippingFee: string;
  total: string;
};
