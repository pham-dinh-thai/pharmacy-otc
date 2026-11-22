import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Cart } from '../../../domain/cart.aggregate';
import {
  CARTS_REPOSITORY,
  type ICartsRepository,
} from '../../../domain/carts.repository';
import { CART_CATALOG, type ICartCatalog } from '../../ports/cart-catalog.port';
import { CartReadModel } from '../../cart.read-model';
import { cartToReadModel } from '../cart-read-model.factory';
import { GetCartQuery } from './get-cart.query';

@QueryHandler(GetCartQuery)
export class GetCartHandler implements IQueryHandler<
  GetCartQuery,
  CartReadModel
> {
  public constructor(
    @Inject(CARTS_REPOSITORY)
    private readonly cartsRepository: ICartsRepository,
    @Inject(CART_CATALOG)
    private readonly catalog: ICartCatalog,
  ) {}

  public async execute(query: GetCartQuery): Promise<CartReadModel> {
    const cart =
      (await this.cartsRepository.findByIdentity(query.identity)) ??
      Cart.create(query.identity);

    const products = await this.catalog.findProducts(
      cart.getItems().map((item) => item.getProductId()),
    );

    return cartToReadModel(cart, products);
  }
}
