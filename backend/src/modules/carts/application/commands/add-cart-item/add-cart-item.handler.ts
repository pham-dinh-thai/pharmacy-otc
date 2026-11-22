import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ProductNotFoundException } from '../../../../products/domain/exceptions/product.exceptions';
import {
  UNIT_OF_WORK,
  type IUnitOfWork,
} from '../../../../../shared/modules/unit-of-work/unit-of-work';
import { loadOrCreateCart } from '../../cart-loader';
import { CART_CATALOG, type ICartCatalog } from '../../ports/cart-catalog.port';
import {
  CARTS_REPOSITORY,
  type ICartsRepository,
} from '../../../domain/carts.repository';
import { AddCartItemCommand } from './add-cart-item.command';

@CommandHandler(AddCartItemCommand)
export class AddCartItemHandler implements ICommandHandler<AddCartItemCommand> {
  public constructor(
    @Inject(CARTS_REPOSITORY)
    private readonly cartsRepository: ICartsRepository,
    @Inject(CART_CATALOG)
    private readonly catalog: ICartCatalog,
    @Inject(UNIT_OF_WORK)
    private readonly unitOfWork: IUnitOfWork,
  ) {}

  public execute(command: AddCartItemCommand): Promise<{ id: string }> {
    return this.unitOfWork.run(async () => {
      const product = await this.catalog.findProduct(command.productId);
      if (!product) {
        throw new ProductNotFoundException(command.productId);
      }

      const { cart, isNew } = await loadOrCreateCart(
        this.cartsRepository,
        command.identity,
        { forUpdate: true },
      );

      cart.addItem(command.productId, command.quantity);

      if (isNew) {
        await this.cartsRepository.create(cart);
      } else {
        await this.cartsRepository.update(cart);
      }

      return { id: cart.getId() };
    });
  }
}
