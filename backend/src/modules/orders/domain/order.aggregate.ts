import { Id } from '../../../shared/domain/value-objects/id.value-object';
import { Money } from '../../../shared/domain/value-objects/money.value-object';
import { OrderLine } from './order-line.entity';
import { OrderPaymentStatus } from './enums/order-payment-status.enum';
import { OrderStatus } from './enums/order-status.enum';
import {
  DuplicateOrderLineException,
  EmptyOrderException,
  InvalidOrderStatusException,
  OrderAlreadyPaidException,
} from './exceptions/order.exception';

export type CreateOrderProps = {
  checkoutId: string;
  userId: string;
  lines: OrderLine[];
  shippingName: string;
  shippingAddress: string;
  shippingPhone: string;
  shippingFee: bigint;
  note: string | null;
};

export type FromPersistentOrderProps = CreateOrderProps & {
  id: string;
  status: OrderStatus;
  paymentStatus: OrderPaymentStatus;
  confirmedAt: Date | null;
  deliveringAt: Date | null;
  completedAt: Date | null;
  cancelledAt: Date | null;
  failedAt: Date | null;
  paidAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export class Order {
  private constructor(
    private readonly id: Id,
    private readonly checkoutId: string,
    private readonly userId: string,
    private readonly lines: OrderLine[],
    private readonly shippingName: string,
    private readonly shippingAddress: string,
    private readonly shippingPhone: string,
    private readonly shippingFee: Money,
    private readonly note: string | null,
    private status: OrderStatus,
    private paymentStatus: OrderPaymentStatus,
    private confirmedAt: Date | null,
    private deliveringAt: Date | null,
    private completedAt: Date | null,
    private cancelledAt: Date | null,
    private failedAt: Date | null,
    private paidAt: Date | null,
    private readonly createdAt: Date,
    private updatedAt: Date,
  ) {}

  public static create(props: CreateOrderProps): Order {
    Order.assertHasLines(props.lines);
    Order.assertNoDuplicateLines(props.lines);

    const now = new Date();

    return new Order(
      Id.generateV7(),
      Id.create(props.checkoutId).toString(),
      Id.create(props.userId).toString(),
      [...props.lines],
      props.shippingName,
      props.shippingAddress,
      props.shippingPhone,
      Money.create(props.shippingFee),
      Order.normalizeNote(props.note),
      OrderStatus.PENDING,
      OrderPaymentStatus.UNPAID,
      null,
      null,
      null,
      null,
      null,
      null,
      now,
      now,
    );
  }

  public static fromPersistent(props: FromPersistentOrderProps): Order {
    return new Order(
      Id.create(props.id),
      Id.create(props.checkoutId).toString(),
      Id.create(props.userId).toString(),
      [...props.lines],
      props.shippingName,
      props.shippingAddress,
      props.shippingPhone,
      Money.create(props.shippingFee),
      Order.normalizeNote(props.note),
      props.status,
      props.paymentStatus,
      props.confirmedAt,
      props.deliveringAt,
      props.completedAt,
      props.cancelledAt,
      props.failedAt,
      props.paidAt,
      props.createdAt,
      props.updatedAt,
    );
  }

  public markPaid(now = new Date()): void {
    if (this.paymentStatus === OrderPaymentStatus.PAID) {
      throw new OrderAlreadyPaidException();
    }

    this.paymentStatus = OrderPaymentStatus.PAID;
    this.paidAt = now;

    if (this.status === OrderStatus.PENDING) {
      this.status = OrderStatus.CONFIRMED;
      this.confirmedAt = now;
    }

    this.updatedAt = now;
  }

  public confirm(now = new Date()): void {
    this.assertStatus(OrderStatus.PENDING, 'confirmed');

    this.status = OrderStatus.CONFIRMED;
    this.confirmedAt = now;
    this.updatedAt = now;
  }

  public fail(now = new Date()): void {
    this.assertStatus(OrderStatus.PENDING, 'marked as failed');

    this.status = OrderStatus.FAILED;
    this.failedAt = now;
    this.updatedAt = now;
  }

  public startDelivery(now = new Date()): void {
    this.assertStatus(OrderStatus.CONFIRMED, 'started delivery');

    this.status = OrderStatus.DELIVERING;
    this.deliveringAt = now;
    this.updatedAt = now;
  }

  public complete(now = new Date()): void {
    this.assertStatus(OrderStatus.DELIVERING, 'completed');

    this.status = OrderStatus.COMPLETED;
    this.completedAt = now;
    this.updatedAt = now;
  }

  public cancel(now = new Date()): void {
    if (
      this.status !== OrderStatus.PENDING &&
      this.status !== OrderStatus.CONFIRMED
    ) {
      throw new InvalidOrderStatusException('cancelled', this.status);
    }

    this.status = OrderStatus.CANCELLED;
    this.cancelledAt = now;
    this.updatedAt = now;
  }

  public getItemsAmount(): bigint {
    const amount = this.lines.reduce(
      (sum: Money, line: OrderLine) => sum.add(line.getTotal()),
      Money.create(0),
    );

    return amount.toBigInt();
  }

  public getTotalAmount(): bigint {
    return this.shippingFee.add(Money.create(this.getItemsAmount())).toBigInt();
  }

  public getId(): string {
    return this.id.toString();
  }

  public getCheckoutId(): string {
    return this.checkoutId;
  }

  public getUserId(): string {
    return this.userId;
  }

  public getLines(): OrderLine[] {
    return [...this.lines];
  }

  public getShippingName(): string {
    return this.shippingName;
  }

  public getShippingAddress(): string {
    return this.shippingAddress;
  }

  public getShippingPhone(): string {
    return this.shippingPhone;
  }

  public getShippingFee(): bigint {
    return this.shippingFee.toBigInt();
  }

  public getNote(): string | null {
    return this.note;
  }

  public getStatus(): OrderStatus {
    return this.status;
  }

  public getPaymentStatus(): OrderPaymentStatus {
    return this.paymentStatus;
  }

  public getConfirmedAt(): Date | null {
    return this.confirmedAt;
  }

  public getDeliveringAt(): Date | null {
    return this.deliveringAt;
  }

  public getCompletedAt(): Date | null {
    return this.completedAt;
  }

  public getCancelledAt(): Date | null {
    return this.cancelledAt;
  }

  public getFailedAt(): Date | null {
    return this.failedAt;
  }

  public getPaidAt(): Date | null {
    return this.paidAt;
  }

  public getCreatedAt(): Date {
    return this.createdAt;
  }

  public getUpdatedAt(): Date {
    return this.updatedAt;
  }

  private static assertHasLines(lines: OrderLine[]): void {
    if (lines.length === 0) {
      throw new EmptyOrderException();
    }
  }

  private static assertNoDuplicateLines(lines: OrderLine[]): void {
    const productIds = new Set<string>();

    for (const line of lines) {
      if (productIds.has(line.getProductId())) {
        throw new DuplicateOrderLineException(line.getProductId());
      }

      productIds.add(line.getProductId());
    }
  }

  private static normalizeNote(raw: string | null): string | null {
    const note = raw?.trim();

    return note || null;
  }

  private assertStatus(expected: OrderStatus, action: string): void {
    if (this.status !== expected) {
      throw new InvalidOrderStatusException(action, this.status);
    }
  }
}
