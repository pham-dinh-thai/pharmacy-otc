export type CheckoutProductSnapshot = {
  productId: string;
  name: string;
  sku: string | null;
  unitPrice: bigint;
};

export interface ICheckoutCatalog {
  findByIds(
    productIds: string[],
  ): Promise<Map<string, CheckoutProductSnapshot>>;
}

export const CHECKOUT_CATALOG = 'ICheckoutCatalog';
