import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  UNIT_OF_WORK,
  type IUnitOfWork,
} from '../../../../../shared/modules/unit-of-work/unit-of-work';
import {
  CARTS_REPOSITORY,
  type ICartsRepository,
} from '../../../domain/carts.repository';
import { DeductCartItemsCommand } from './deduct-cart-items.command';

@CommandHandler(DeductCartItemsCommand)
export class DeductCartItemsHandler implements ICommandHandler<
  DeductCartItemsCommand,
  { changed: boolean }
> {
  public constructor(
    @Inject(CARTS_REPOSITORY)
    private readonly cartsRepository: ICartsRepository,
    @Inject(UNIT_OF_WORK)
    private readonly unitOfWork: IUnitOfWork,
  ) {}

  public execute(
    command: DeductCartItemsCommand,
  ): Promise<{ changed: boolean }> {
    return this.unitOfWork.run(async () => {
      if (command.items.length === 0) return { changed: false };

      const cart = await this.cartsRepository.findByIdentity(command.identity, {
        forUpdate: true,
      });

      if (!cart) return { changed: false };

      let changed = false;

      for (const item of command.items) {
        const cartItem = cart
          .getItems()
          .find((entry) => entry.isForProduct(item.productId));

        if (!cartItem) continue;

        changed = true;
        const remaining = cartItem.getQuantity() - item.quantity;
        cart.setItemQuantity(item.productId, Math.max(0, remaining));
      }

      if (changed) {
        await this.cartsRepository.update(cart);
      }

      return { changed };
    });
  }
}
