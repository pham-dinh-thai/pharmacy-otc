import { Checkout } from '../../domain/checkout.aggregate';
import { CheckoutLine } from '../../domain/checkout-line.entity';
import { CheckoutStatus } from '../../domain/enums/checkout-status.enum';
import { CheckoutMapper } from './checkout.mapper';

const USER_ID = '9f7a1c3e-2b4d-4a61-8f0e-1c2d3e4f5a6b';
const PRODUCT_ID = '01931f7a-1c3e-7a61-8f0e-1c2d3e4f5a6b';

describe('CheckoutMapper', () => {
  const buildCheckout = (): Checkout =>
    Checkout.create({
      userId: USER_ID,
      shippingName: 'Nguyen Van A',
      shippingAddress: '1 Nguyen Hue',
      shippingPhone: '0901234567',
      lines: [
        CheckoutLine.create({
          productId: PRODUCT_ID,
          unitPrice: 25000n,
          quantity: 3,
        }),
      ],
    });

  it('maps a checkout and its lines to Mikro entities', () => {
    const checkout = buildCheckout();

    const { checkout: mikroCheckout, lines } = CheckoutMapper.toMikro(checkout);

    expect(mikroCheckout.id).toBe(checkout.getId());
    expect(mikroCheckout.userId).toBe(USER_ID);
    expect(mikroCheckout.status).toBe(CheckoutStatus.PENDING);
    expect(lines).toHaveLength(1);
    expect(lines[0]).toMatchObject({
      checkoutId: checkout.getId(),
      productId: PRODUCT_ID,
      unitPrice: 25000n,
      quantity: 3,
    });
  });

  it('restores the aggregate from persisted entities', () => {
    const checkout = buildCheckout();
    const { checkout: mikroCheckout, lines } = CheckoutMapper.toMikro(checkout);

    const restored = CheckoutMapper.toDomain(mikroCheckout, lines);

    expect(restored.getId()).toBe(checkout.getId());
    expect(restored.getUserId()).toBe(USER_ID);
    expect(restored.getStatus()).toBe(CheckoutStatus.PENDING);
    expect(restored.getLines()).toHaveLength(1);
    expect(restored.getLines()[0].getProductId()).toBe(PRODUCT_ID);
    expect(restored.getLines()[0].getUnitPrice()).toBe(25000n);
    expect(restored.getLines()[0].getQuantity()).toBe(3);
    expect(restored.getAmount()).toBe(75000n);
  });
});
