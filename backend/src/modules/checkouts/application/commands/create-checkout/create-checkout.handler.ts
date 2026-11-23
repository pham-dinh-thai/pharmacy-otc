import { Inject, Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { auditEventPayload } from '../../../../audit-logs/domain/events/audit-event.payload';
import { EntityType } from '../../../../audit-logs/domain/enums/entity-type.enum';
import {
  type IOutboxRepository,
  OUTBOX_REPOSITORY,
} from '../../../../../shared/modules/outbox/domain/outbox.repository';
import {
  type IUnitOfWork,
  UNIT_OF_WORK,
} from '../../../../../shared/modules/unit-of-work/unit-of-work';
import { CARTS_REPOSITORY } from '../../../../carts/domain/carts.repository';
import type { ICartsRepository } from '../../../../carts/domain/carts.repository';
import { CHECKOUT_CATALOG } from '../../ports/checkout-catalog.port';
import type { ICheckoutCatalog } from '../../ports/checkout-catalog.port';
import { Checkout } from '../../../domain/checkout.aggregate';
import { CheckoutLine } from '../../../domain/checkout-line.entity';
import {
  CHECKOUTS_REPOSITORY,
  type ICheckoutRepository,
} from '../../../domain/checkouts.repository';
import { CHECKOUT_CREATED_AUDIT_EVENT } from '../../../domain/events/checkout-created.event';
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

    @Inject(OUTBOX_REPOSITORY)
    private readonly outboxRepository: IOutboxRepository,
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
      });

      await this.checkoutsRepository.create(checkout);

      await this.outboxRepository.create({
        eventType: CHECKOUT_CREATED_AUDIT_EVENT,
        payload: auditEventPayload(command.headers, {
          entityType: EntityType.CHECKOUTS,
          entityId: checkout.getId(),
          metadata: {
            productIds: command.productIds,
            lineCount: lines.length,
            amount: checkout.getAmount().toString(),
          },
        }),
      });

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
        unitPrice: snapshot.unitPrice,
        quantity: item.getQuantity(),
      });
    });
  }
}
