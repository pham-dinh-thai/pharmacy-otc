import { Inject, Injectable } from '@nestjs/common';
import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { EntityType } from '../../../../audit-logs/domain/enums/entity-type.enum';
import {
  type IUnitOfWork,
  UNIT_OF_WORK,
} from '../../../../../shared/modules/unit-of-work/unit-of-work';
import { CARTS_REPOSITORY } from '../../../../carts/domain/carts.repository';
import type { ICartsRepository } from '../../../../carts/domain/carts.repository';
import { RecordAuditLogCommand } from '../../../../audit-logs/application/commands/record-audit-log/record-audit-log.command';
import { recordAuditProps } from '../../../../audit-logs/application/record-audit-log-props';
import { CHECKOUT_CATALOG } from '../../ports/checkout-catalog.port';
import type { ICheckoutCatalog } from '../../ports/checkout-catalog.port';
import { Checkout } from '../../../domain/checkout.aggregate';
import { CheckoutLine } from '../../../domain/checkout-line.entity';
import {
  CHECKOUTS_REPOSITORY,
  type ICheckoutRepository,
} from '../../../domain/checkouts.repository';
import {
  CheckoutProductNotInCartException,
  CheckoutProductNotFoundException,
  EmptyCheckoutException,
} from '../../../domain/exceptions/checkout.exception';
import { CreateCheckoutCommand } from './create-checkout.command';

@CommandHandler(CreateCheckoutCommand)
@Injectable()
export class CreateCheckoutHandler implements ICommandHandler<CreateCheckoutCommand> {
  public constructor(
    @Inject(UNIT_OF_WORK)
    private readonly unitOfWork: IUnitOfWork,

    @Inject(CHECKOUTS_REPOSITORY)
    private readonly checkoutsRepository: ICheckoutRepository,

    @Inject(CARTS_REPOSITORY)
    private readonly cartsRepository: ICartsRepository,

    @Inject(CHECKOUT_CATALOG)
    private readonly checkoutCatalog: ICheckoutCatalog,

    private readonly commandBus: CommandBus,
  ) {}

  public async execute(
    command: CreateCheckoutCommand,
  ): Promise<{ id: string }> {
    return this.unitOfWork.run(async () => {
      const lines = await this.prepareLines(command);

      const checkout = Checkout.create({
        userId: command.userId,
        lines,
        shippingName: command.shippingName,
        shippingAddress: command.shippingAddress,
        shippingPhone: command.shippingPhone,
        paymentMethod: command.paymentMethod,
      });

      await this.checkoutsRepository.create(checkout);

      await this.commandBus.execute(
        new RecordAuditLogCommand(
          recordAuditProps(command.headers, {
            action: 'create',
            entityType: EntityType.CHECKOUTS,
            entityId: checkout.getId(),
            metadata: {
              productIds: command.productIds,
              lineCount: lines.length,
              amount: checkout.getAmount().toString(),
              paymentMethod: checkout.getPaymentMethod(),
            },
          }),
        ),
      );

      return { id: checkout.getId() };
    });
  }

  private async prepareLines(
    command: CreateCheckoutCommand,
  ): Promise<CheckoutLine[]> {
    const selectedProductIds = [...new Set(command.productIds)];

    if (selectedProductIds.length === 0) {
      throw new EmptyCheckoutException();
    }

    const cart = await this.cartsRepository.findByIdentity(
      { userId: command.userId },
      { forUpdate: true },
    );

    if (!cart) {
      throw new EmptyCheckoutException();
    }

    const cartItems = cart.getItems();
    const itemByProductId = new Map(
      cartItems.map((item) => [item.getProductId(), item] as const),
    );

    const selectedItems = selectedProductIds.map((productId) => {
      const item = itemByProductId.get(productId);

      if (!item) {
        throw new CheckoutProductNotInCartException(productId);
      }

      return item;
    });

    const snapshots = await this.checkoutCatalog.findByIds(selectedProductIds);

    return selectedItems.map((item) => {
      const snapshot = snapshots.get(item.getProductId());

      if (!snapshot) {
        throw new CheckoutProductNotFoundException(item.getProductId());
      }

      return CheckoutLine.create({
        productId: item.getProductId(),
        productName: snapshot.name,
        productSku: snapshot.sku,
        unitPrice: snapshot.unitPrice,
        quantity: item.getQuantity(),
      });
    });
  }
}
