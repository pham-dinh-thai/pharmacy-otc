import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  UNIT_OF_WORK,
  type IUnitOfWork,
} from '../../../../../shared/modules/unit-of-work/unit-of-work';
import { ProductNotFoundException } from '../../../../products/domain/exceptions/product.exceptions';
import { loadOrCreateCart } from '../../cart-loader';
import { CART_CATALOG, type ICartCatalog } from '../../ports/cart-catalog.port';
import {
  CARTS_REPOSITORY,
  type ICartsRepository,
} from '../../../domain/carts.repository';
import { AddCartItemsCommand } from './add-cart-items.command';

@CommandHandler(AddCartItemsCommand)
export class AddCartItemsHandler implements ICommandHandler<
  AddCartItemsCommand,
  { id: string; totalItems: number }
> {
  public constructor(
    @Inject(CARTS_REPOSITORY)
    private readonly cartsRepository: ICartsRepository,
    @Inject(CART_CATALOG)
    private readonly catalog: ICartCatalog,
    @Inject(UNIT_OF_WORK)
    private readonly unitOfWork: IUnitOfWork,
  ) {}

  public execute(
    command: AddCartItemsCommand,
  ): Promise<{ id: string; totalItems: number }> {
    return this.unitOfWork.run(async () => {
      const productIds = [
        ...new Set(command.items.map((item) => item.productId)),
      ];
      const products = await this.catalog.findProducts(productIds);

      for (const productId of productIds) {
        if (!products.has(productId)) {
          throw new ProductNotFoundException(productId);
        }
      }

      const { cart, isNew } = await loadOrCreateCart(
        this.cartsRepository,
        command.identity,
        { forUpdate: true },
      );

      for (const item of command.items) {
        cart.addItem(item.productId, item.quantity);
      }

      if (isNew) {
        await this.cartsRepository.create(cart);
      } else {
        await this.cartsRepository.update(cart);
      }

      return {
        id: cart.getId(),
        totalItems: cart
          .getItems()
          .reduce((sum, item) => sum + item.getQuantity(), 0),
      };
    });
  }
}
