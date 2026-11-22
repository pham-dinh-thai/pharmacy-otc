import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  UNIT_OF_WORK,
  type IUnitOfWork,
} from '../../../../../shared/modules/unit-of-work/unit-of-work';
import { loadOrCreateCart } from '../../cart-loader';
import {
  CARTS_REPOSITORY,
  type ICartsRepository,
} from '../../../domain/carts.repository';
import { ClearCartCommand } from './clear-cart.command';

@CommandHandler(ClearCartCommand)
export class ClearCartHandler implements ICommandHandler<ClearCartCommand> {
  public constructor(
    @Inject(CARTS_REPOSITORY)
    private readonly cartsRepository: ICartsRepository,
    @Inject(UNIT_OF_WORK)
    private readonly unitOfWork: IUnitOfWork,
  ) {}

  public execute(command: ClearCartCommand): Promise<{ id: string }> {
    return this.unitOfWork.run(async () => {
      const { cart, isNew } = await loadOrCreateCart(
        this.cartsRepository,
        command.identity,
        { forUpdate: true },
      );

      cart.clear();

      if (isNew) {
        await this.cartsRepository.create(cart);
      } else {
        await this.cartsRepository.update(cart);
      }

      return { id: cart.getId() };
    });
  }
}
