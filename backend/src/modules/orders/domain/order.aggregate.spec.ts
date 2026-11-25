import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import { OrderPaymentStatus } from './enums/order-payment-status.enum';
import { OrderStatus } from './enums/order-status.enum';
import {
  DuplicateOrderLineException,
  EmptyOrderException,
  InvalidOrderStatusException,
  OrderAlreadyPaidException,
} from './exceptions/order.exception';
import { Order } from './order.aggregate';
import { OrderLine } from './order-line.entity';

const CHECKOUT_ID = '01931f7a-1c3e-7a61-8f0e-1c2d3e4f5a6b';
const USER_ID = '9f7a1c3e-2b4d-4a61-8f0e-1c2d3e4f5a6b';
const PRODUCT_A = '642b3190-9e97-4ce3-8533-894bc879b4fc';
const PRODUCT_B = '8a2f6c1e-3b4d-4e5f-9a0b-1c2d3e4f5a6b';
const NOW = new Date('2026-11-25T10:00:00.000Z');
const LATER = new Date('2026-11-25T10:05:00.000Z');

const lineA = () =>
  OrderLine.create({
    productId: PRODUCT_A,
    productName: 'Paracetamol 500mg',
    productSku: 'SKU-001',
    unitPrice: 25000n,
    quantity: 2,
  });

const lineB = () =>
  OrderLine.create({
    productId: PRODUCT_B,
    productName: 'Vitamin C',
    productSku: null,
    unitPrice: 12000n,
    quantity: 2,
  });

const baseProps = {
  checkoutId: CHECKOUT_ID,
  userId: USER_ID,
  shippingName: 'Nguyen Van A',
  shippingAddress: '1 Nguyen Hue',
  shippingPhone: '0901234567',
  shippingFee: 30000n,
  note: '  Giao trong giờ hành chính  ',
};

describe('Order', () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(NOW);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('creates an order in PENDING status from checkout snapshots', () => {
    const order = Order.create({ ...baseProps, lines: [lineA(), lineB()] });

    expect(order.getId()).toBeTruthy();
    expect(order.getCheckoutId()).toBe(CHECKOUT_ID);
    expect(order.getUserId()).toBe(USER_ID);
    expect(order.getStatus()).toBe(OrderStatus.PENDING);
    expect(order.getPaymentStatus()).toBe(OrderPaymentStatus.UNPAID);
    expect(order.getLines()).toHaveLength(2);
    expect(order.getItemsAmount()).toBe(74000n);
    expect(order.getShippingFee()).toBe(30000n);
    expect(order.getTotalAmount()).toBe(104000n);
    expect(order.getNote()).toBe('Giao trong giờ hành chính');
    expect(order.getShippingName()).toBe('Nguyen Van A');
    expect(order.getShippingAddress()).toBe('1 Nguyen Hue');
    expect(order.getShippingPhone()).toBe('0901234567');
    expect(order.getConfirmedAt()).toBeNull();
    expect(order.getDeliveringAt()).toBeNull();
    expect(order.getCompletedAt()).toBeNull();
    expect(order.getCancelledAt()).toBeNull();
    expect(order.getFailedAt()).toBeNull();
    expect(order.getPaidAt()).toBeNull();
    expect(order.getCreatedAt()).toEqual(NOW);
    expect(order.getUpdatedAt()).toEqual(NOW);
  });

  it('rejects an order without lines', () => {
    expect(() => Order.create({ ...baseProps, lines: [] })).toThrow(
      EmptyOrderException,
    );
  });

  it('rejects duplicate products', () => {
    expect(() =>
      Order.create({ ...baseProps, lines: [lineA(), lineA()] }),
    ).toThrow(DuplicateOrderLineException);
  });

  it('confirms a pending order', () => {
    const order = Order.create({ ...baseProps, lines: [lineA()] });

    order.confirm(LATER);

    expect(order.getStatus()).toBe(OrderStatus.CONFIRMED);
    expect(order.getConfirmedAt()).toEqual(LATER);
    expect(order.getUpdatedAt()).toEqual(LATER);
  });

  it('marks a pending order as paid and confirmed', () => {
    const order = Order.create({ ...baseProps, lines: [lineA()] });

    order.markPaid(LATER);

    expect(order.getPaymentStatus()).toBe(OrderPaymentStatus.PAID);
    expect(order.getPaidAt()).toEqual(LATER);
    expect(order.getStatus()).toBe(OrderStatus.CONFIRMED);
    expect(order.getConfirmedAt()).toEqual(LATER);
  });

  it('rejects marking an order as paid twice', () => {
    const order = Order.create({ ...baseProps, lines: [lineA()] });
    order.markPaid(NOW);

    expect(() => order.markPaid(LATER)).toThrow(OrderAlreadyPaidException);
  });

  it('marks a pending order as failed', () => {
    const order = Order.create({ ...baseProps, lines: [lineA()] });

    order.fail(LATER);

    expect(order.getStatus()).toBe(OrderStatus.FAILED);
    expect(order.getFailedAt()).toEqual(LATER);
    expect(order.getUpdatedAt()).toEqual(LATER);
  });

  it('moves a confirmed order through delivering to completed', () => {
    const order = Order.create({ ...baseProps, lines: [lineA()] });
    order.confirm(NOW);

    order.startDelivery(LATER);
    expect(order.getStatus()).toBe(OrderStatus.DELIVERING);
    expect(order.getDeliveringAt()).toEqual(LATER);

    order.complete(LATER);
    expect(order.getStatus()).toBe(OrderStatus.COMPLETED);
    expect(order.getCompletedAt()).toEqual(LATER);
  });

  it('cancels a pending or confirmed order', () => {
    const pending = Order.create({ ...baseProps, lines: [lineA()] });
    pending.cancel(LATER);
    expect(pending.getStatus()).toBe(OrderStatus.CANCELLED);
    expect(pending.getCancelledAt()).toEqual(LATER);

    const confirmed = Order.create({ ...baseProps, lines: [lineA()] });
    confirmed.confirm(NOW);
    confirmed.cancel(LATER);
    expect(confirmed.getStatus()).toBe(OrderStatus.CANCELLED);
  });

  it('rejects invalid status transitions', () => {
    const completed = Order.create({ ...baseProps, lines: [lineA()] });
    completed.confirm(NOW);
    completed.startDelivery(NOW);
    completed.complete(NOW);

    expect(() => completed.confirm(LATER)).toThrow(InvalidOrderStatusException);
    expect(() => completed.cancel(LATER)).toThrow(InvalidOrderStatusException);

    const pending = Order.create({ ...baseProps, lines: [lineA()] });
    expect(() => pending.startDelivery(LATER)).toThrow(
      InvalidOrderStatusException,
    );
    expect(() => pending.complete(LATER)).toThrow(InvalidOrderStatusException);
  });

  it('restores an order from persistence', () => {
    const id = '01931f7a-1c3e-7a61-8f0e-1c2d3e4f5a6c';
    const order = Order.fromPersistent({
      ...baseProps,
      id,
      lines: [lineA()],
      status: OrderStatus.DELIVERING,
      paymentStatus: OrderPaymentStatus.PAID,
      confirmedAt: NOW,
      deliveringAt: LATER,
      completedAt: null,
      cancelledAt: null,
      failedAt: null,
      paidAt: NOW,
      createdAt: NOW,
      updatedAt: LATER,
    });

    expect(order.getId()).toBe(id);
    expect(order.getStatus()).toBe(OrderStatus.DELIVERING);
    expect(order.getPaymentStatus()).toBe(OrderPaymentStatus.PAID);
    expect(order.getDeliveringAt()).toEqual(LATER);
    expect(order.getTotalAmount()).toBe(80000n);
  });
});
