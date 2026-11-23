import type { Checkout } from './checkout.aggregate';
import type { CheckoutStatus } from './enums/checkout-status.enum';

export type FindCheckoutOptions = {
  forUpdate?: boolean;
};

export type FindCheckoutsFilters = {
  userId?: string;
  status?: CheckoutStatus | 'all';
  limit?: number;
  offset?: number;
};

export type CheckoutPage = {
  items: Checkout[];
  total: number;
};

export interface ICheckoutRepository {
  findPage(filters?: FindCheckoutsFilters): Promise<CheckoutPage>;

  findById(id: string, options?: FindCheckoutOptions): Promise<Checkout | null>;

  create(checkout: Checkout): Promise<Checkout>;

  update(checkout: Checkout): Promise<Checkout>;
}

export const CHECKOUTS_REPOSITORY = 'ICheckoutRepository';
