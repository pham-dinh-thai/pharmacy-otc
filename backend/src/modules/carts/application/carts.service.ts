import { Inject, Injectable } from '@nestjs/common';
import { Quantity } from '../../../shared/value-objects/quantity.value-object';
import { ProductNotFoundException } from '../../products/domain/exceptions/product.exceptions';
import { StorefrontService } from '../../storefront/application/storefront.service';
import type { StorefrontProduct } from '../../storefront/application/storefront.read-model';
import { CartLimitExceededException } from '../domain/exceptions/cart.exceptions';
import { CARTS_REPOSITORY } from '../domain/carts.repository';
import type {
  CartIdentity,
  CartItemRecord,
  CartRecord,
  ICartsRepository,
} from '../domain/carts.repository';
import type { CartItemReadModel, CartReadModel } from './cart.read-model';

export const MAX_CART_ITEMS = 100;

const FREE_SHIPPING_THRESHOLD = 250_000n;
const SHIPPING_FEE = 25_000n;

@Injectable()
export class CartsService {
  public constructor(
    @Inject(CARTS_REPOSITORY)
    private readonly cartsRepository: ICartsRepository,
    private readonly storefrontService: StorefrontService,
  ) {}

  public async getCart(identity: CartIdentity): Promise<CartReadModel> {
    const cart = await this.resolveCart(identity);

    return this.toReadModel(cart);
  }

  public async addItem(
    identity: CartIdentity,
    productId: string,
    quantity: number,
  ): Promise<CartReadModel> {
    Quantity.create(quantity);
    await this.ensureProduct(productId);

    const cart = await this.resolveCart(identity);
    const items = [...cart.items];
    const existing = items.find((item) => item.productId === productId);

    if (existing) {
      existing.quantity = Quantity.create(existing.quantity)
        .add(quantity)
        .getValue();
    } else {
      items.push({ productId, quantity });
    }

    this.ensureLimit(items);

    return this.saveAndRender(cart, items);
  }

  public async setItemQuantity(
    identity: CartIdentity,
    productId: string,
    quantity: number,
  ): Promise<CartReadModel> {
    const value = Quantity.create(quantity).getValue();
    const cart = await this.resolveCart(identity);

    if (value === 0) {
      return this.saveAndRender(
        cart,
        cart.items.filter((item) => item.productId !== productId),
      );
    }

    if (!cart.items.some((item) => item.productId === productId)) {
      throw new ProductNotFoundException(productId);
    }

    const items = cart.items.map((item) =>
      item.productId === productId ? { ...item, quantity: value } : item,
    );
    this.ensureLimit(items);

    return this.saveAndRender(cart, items);
  }

  public async removeItem(
    identity: CartIdentity,
    productId: string,
  ): Promise<CartReadModel> {
    const cart = await this.resolveCart(identity);

    return this.saveAndRender(
      cart,
      cart.items.filter((item) => item.productId !== productId),
    );
  }

  public async clear(identity: CartIdentity): Promise<CartReadModel> {
    const cart = await this.resolveCart(identity);

    return this.saveAndRender(cart, []);
  }

  private ensureLimit(items: CartItemRecord[]): void {
    const total = items.reduce((sum, item) => sum + item.quantity, 0);
    if (total > MAX_CART_ITEMS) {
      throw new CartLimitExceededException(MAX_CART_ITEMS);
    }
  }

  private async resolveCart(identity: CartIdentity): Promise<CartRecord> {
    const cart = await this.cartsRepository.findByIdentity(identity);

    return cart ?? this.cartsRepository.create(identity);
  }

  private async saveAndRender(
    cart: CartRecord,
    requestedItems: CartItemRecord[],
  ): Promise<CartReadModel> {
    const products = await this.loadProducts(
      requestedItems.map((item) => item.productId),
    );
    const items = requestedItems.filter((item) => products.has(item.productId));
    await this.cartsRepository.saveItems(cart.id, items);

    return this.render(cart, items, products);
  }

  private async toReadModel(cart: CartRecord): Promise<CartReadModel> {
    const products = await this.loadProducts(
      cart.items.map((item) => item.productId),
    );

    return this.render(
      cart,
      cart.items.filter((item) => products.has(item.productId)),
      products,
    );
  }

  private async loadProducts(
    productIds: string[],
  ): Promise<Map<string, StorefrontProduct>> {
    const uniqueIds = [...new Set(productIds)];
    const products = await Promise.all(
      uniqueIds.map((id) => this.storefrontService.getProduct(id)),
    );

    return new Map(
      products.flatMap((product) =>
        product ? [[product.id, product] as const] : [],
      ),
    );
  }

  private async ensureProduct(productId: string): Promise<void> {
    const product = await this.storefrontService.getProduct(productId);
    if (!product) throw new ProductNotFoundException(productId);
  }

  private render(
    cart: CartRecord,
    items: CartItemRecord[],
    products: Map<string, StorefrontProduct>,
  ): CartReadModel {
    const cartItems: CartItemReadModel[] = [];
    let subtotal = 0n;
    let totalItems = 0;

    for (const item of items) {
      const product = products.get(item.productId);
      if (!product) continue;

      const lineTotal = BigInt(product.unitPrice) * BigInt(item.quantity);
      subtotal += lineTotal;
      totalItems += item.quantity;
      cartItems.push({
        product,
        quantity: item.quantity,
        lineTotal: lineTotal.toString(),
      });
    }

    const shippingFee =
      subtotal === 0n || subtotal >= FREE_SHIPPING_THRESHOLD
        ? 0n
        : SHIPPING_FEE;

    return {
      kind: cart.userId ? 'user' : 'guest',
      items: cartItems,
      totalItems,
      subtotal: subtotal.toString(),
      shippingFee: shippingFee.toString(),
      total: (subtotal + shippingFee).toString(),
    };
  }
}
