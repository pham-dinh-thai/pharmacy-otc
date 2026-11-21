export type CartIdentity = {
  userId?: string;
  guestToken?: string;
};

export type CartItemRecord = {
  productId: string;
  quantity: number;
};

export type CartRecord = {
  id: string;
  userId: string | null;
  guestToken: string | null;
  items: CartItemRecord[];
};

export interface ICartsRepository {
  findByIdentity(identity: CartIdentity): Promise<CartRecord | null>;
  create(identity: CartIdentity): Promise<CartRecord>;
  saveItems(cartId: string, items: CartItemRecord[]): Promise<void>;
  delete(cartId: string): Promise<void>;
}

export const CARTS_REPOSITORY = 'ICartsRepository';
