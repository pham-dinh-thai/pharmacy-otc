import { describe, expect, it } from '@jest/globals';
import { Order } from '../../domain/order.aggregate';
import { OrderLine } from '../../domain/order-line.entity';
import { OrderPaymentStatus } from '../../domain/enums/order-payment-status.enum';
import { OrderStatus } from '../../domain/enums/order-status.enum';
import { OrderMapper } from './order.mapper';

const CHECKOUT_ID = '01931f7a-1c3e-7a61-8f0e-1c2d3e4f5a6b';
const USER_ID = '9f7a1c3e-2b4d-4a61-8f0e-1c2d3e4f5a6b';
const PRODUCT_ID = '642b3190-9e97-4ce3-8533-894bc879b4fc';

const buildOrder = (): Order =>
  Order.create({
    checkoutId: CHECKOUT_ID,
    userId: USER_ID,
    lines: [
      OrderLine.create({
        productId: PRODUCT_ID,
        productName: 'Paracetamol 500mg',
        productSku: 'sku-001',
        unitPrice: 25000n,
        quantity: 2,
      }),
    ],
    shippingName: 'Nguyen Van A',
    shippingAddress: '1 Nguyen Hue',
    shippingPhone: '0901234567',
    shippingFee: 30000n,
    note: 'Giao nhanh',
  });

describe('OrderMapper', () => {
  it('maps an order and its lines to Mikro entities', () => {
    const order = buildOrder();

    const { order: mikroOrder, lines } = OrderMapper.toMikro(order);

    expect(mikroOrder.id).toBe(order.getId());
    expect(mikroOrder.checkoutId).toBe(CHECKOUT_ID);
    expect(mikroOrder.userId).toBe(USER_ID);
    expect(mikroOrder.status).toBe(OrderStatus.PENDING);
    expect(mikroOrder.paymentStatus).toBe(OrderPaymentStatus.UNPAID);
    expect(mikroOrder.shippingFee).toBe(30000n);
    expect(lines).toHaveLength(1);
    expect(lines[0]).toMatchObject({
      orderId: order.getId(),
      productId: PRODUCT_ID,
      productName: 'Paracetamol 500mg',
      productSku: 'SKU-001',
      unitPrice: 25000n,
      quantity: 2,
    });
  });

  it('restores the aggregate from persisted entities', () => {
    const order = buildOrder();
    const { order: mikroOrder, lines } = OrderMapper.toMikro(order);

    const restored = OrderMapper.toDomain(mikroOrder, lines);

    expect(restored.getId()).toBe(order.getId());
    expect(restored.getCheckoutId()).toBe(CHECKOUT_ID);
    expect(restored.getStatus()).toBe(OrderStatus.PENDING);
    expect(restored.getPaymentStatus()).toBe(OrderPaymentStatus.UNPAID);
    expect(restored.getLines()).toHaveLength(1);
    expect(restored.getLines()[0].getProductSku()).toBe('SKU-001');
    expect(restored.getItemsAmount()).toBe(50000n);
    expect(restored.getTotalAmount()).toBe(80000n);
  });
});
