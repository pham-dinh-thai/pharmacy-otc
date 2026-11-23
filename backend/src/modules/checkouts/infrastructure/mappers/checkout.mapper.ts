import { Checkout } from '../../domain/checkout.aggregate';
import { CheckoutLine } from '../../domain/checkout-line.entity';
import { MikroCheckout } from '../entities/mikro-checkout.entity';
import { MikroCheckoutLine } from '../entities/mikro-checkout-line.entity';

export class CheckoutMapper {
  public static toDomain(
    mikroCheckout: MikroCheckout,
    mikroLines: MikroCheckoutLine[],
  ): Checkout {
    return Checkout.fromPersistent({
      id: mikroCheckout.id,
      userId: mikroCheckout.userId,
      lines: mikroLines.map((line) => CheckoutMapper.toLineDomain(line)),
      shippingName: mikroCheckout.shippingName,
      shippingAddress: mikroCheckout.shippingAddress,
      shippingPhone: mikroCheckout.shippingPhone,
      status: mikroCheckout.status,
      confirmedAt: mikroCheckout.confirmedAt,
      cancelledAt: mikroCheckout.cancelledAt,
      createdAt: mikroCheckout.createdAt,
      updatedAt: mikroCheckout.updatedAt,
    });
  }

  public static toMikro(checkout: Checkout): {
    checkout: MikroCheckout;
    lines: MikroCheckoutLine[];
  } {
    const mikroCheckout = CheckoutMapper.assign(new MikroCheckout(), checkout);

    return {
      checkout: mikroCheckout,
      lines: checkout
        .getLines()
        .map((line) => CheckoutMapper.toLineMikro(line, checkout.getId())),
    };
  }

  public static assign(
    mikroCheckout: MikroCheckout,
    checkout: Checkout,
  ): MikroCheckout {
    mikroCheckout.id = checkout.getId();
    mikroCheckout.userId = checkout.getUserId();
    mikroCheckout.shippingName = checkout.getShippingName();
    mikroCheckout.shippingAddress = checkout.getShippingAddress();
    mikroCheckout.shippingPhone = checkout.getShippingPhone();
    mikroCheckout.status = checkout.getStatus();
    mikroCheckout.confirmedAt = checkout.getConfirmedAt();
    mikroCheckout.cancelledAt = checkout.getCancelledAt();
    mikroCheckout.createdAt = checkout.getCreatedAt();
    mikroCheckout.updatedAt = checkout.getUpdatedAt();

    return mikroCheckout;
  }

  private static toLineDomain(mikroLine: MikroCheckoutLine): CheckoutLine {
    return CheckoutLine.fromPersistent({
      id: mikroLine.id,
      productId: mikroLine.productId,
      unitPrice: mikroLine.unitPrice,
      quantity: mikroLine.quantity,
    });
  }

  private static toLineMikro(
    line: CheckoutLine,
    checkoutId: string,
  ): MikroCheckoutLine {
    const mikroLine = new MikroCheckoutLine();

    mikroLine.id = line.getId();
    mikroLine.checkoutId = checkoutId;
    mikroLine.productId = line.getProductId();
    mikroLine.unitPrice = BigInt(line.getUnitPrice());
    mikroLine.quantity = line.getQuantity();

    return mikroLine;
  }
}
