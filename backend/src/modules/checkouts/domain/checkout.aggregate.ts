import { PaymentMethod } from '../../../shared/domain/enums/payment-method.enum';
import { Id } from '../../../shared/domain/value-objects/id.value-object';
import { Money } from '../../../shared/domain/value-objects/money.value-object';
import { CheckoutLine } from './checkout-line.entity';
import { CheckoutStatus } from './enums/checkout-status.enum';
import {
  CanNotUpdateCheckoutStatusException,
  CheckoutExpiredException,
} from './exceptions/checkout.exception';

export type CreateCheckoutProps = {
  userId: string;
  lines: CheckoutLine[];
  shippingName: string;
  shippingAddress: string;
  shippingPhone: string;
  paymentMethod: PaymentMethod;
};

export type FromPersistentCheckoutProps = {
  id: string;
  userId: string;
  lines: CheckoutLine[];
  shippingName: string;
  shippingAddress: string;
  shippingPhone: string;
  paymentMethod: PaymentMethod;
  status: CheckoutStatus;
  confirmingAt: Date | null;
  confirmedAt: Date | null;
  cancelledAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type UpdateCheckoutProps = {
  shippingName: string;
  shippingAddress: string;
  shippingPhone: string;
  paymentMethod: PaymentMethod;
};

export class Checkout {
  private constructor(
    private readonly id: Id,
    private readonly userId: string,
    private readonly lines: CheckoutLine[],
    private shippingName: string,
    private shippingAddress: string,
    private shippingPhone: string,
    private paymentMethod: PaymentMethod,
    private status: CheckoutStatus,
    private confirmingAt: Date | null,
    private confirmedAt: Date | null,
    private cancelledAt: Date | null,
    private readonly createdAt: Date,
    private updatedAt: Date,
  ) {}

  public static create(props: CreateCheckoutProps): Checkout {
    const now = new Date();

    return new Checkout(
      Id.generateV7(),
      props.userId,
      props.lines,
      props.shippingName,
      props.shippingAddress,
      props.shippingPhone,
      props.paymentMethod,
      CheckoutStatus.PENDING,
      null,
      null,
      null,
      now,
      now,
    );
  }

  public static fromPersistent(props: FromPersistentCheckoutProps): Checkout {
    return new Checkout(
      Id.create(props.id),
      props.userId,
      props.lines,
      props.shippingName,
      props.shippingAddress,
      props.shippingPhone,
      props.paymentMethod,
      props.status,
      props.confirmingAt,
      props.confirmedAt,
      props.cancelledAt,
      props.createdAt,
      props.updatedAt,
    );
  }

  public update(props: UpdateCheckoutProps, now = new Date()): void {
    this.assertEditable(now);

    this.updateShippingInfo(
      props.shippingName,
      props.shippingAddress,
      props.shippingPhone,
    );

    this.updatePaymentMethod(props.paymentMethod);

    this.status = CheckoutStatus.CONFIRMING;

    this.confirmingAt = now;
    this.updatedAt = now;
  }

  public confirm(now = new Date()): void {
    this.assertEditable(now);

    this.status = CheckoutStatus.CONFIRMED;

    this.confirmedAt = now;
    this.updatedAt = now;
  }

  public cancel(now = new Date()): void {
    this.assertEditable(now);

    this.status = CheckoutStatus.CANCELLED;

    this.cancelledAt = now;
    this.updatedAt = now;
  }

  public getAmount(): bigint {
    const amount: Money = this.lines.reduce(
      (sum: Money, line: CheckoutLine) => sum.add(line.getTotal()),
      Money.create(0),
    );

    return amount.toBigInt();
  }

  public getId(): string {
    return this.id.toString();
  }

  public getUserId(): string {
    return this.userId;
  }

  public getLines(): CheckoutLine[] {
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

  public getPaymentMethod(): PaymentMethod {
    return this.paymentMethod;
  }

  public getStatus(): CheckoutStatus {
    return this.status;
  }

  public getExpiresAt(): Date {
    return new Date(this.createdAt.getTime() + 30 * 60 * 1000); // 30 Mins after created
  }

  public getConfirmingAt(): Date | null {
    return this.confirmingAt;
  }

  public getConfirmedAt(): Date | null {
    return this.confirmedAt;
  }

  public getCancelledAt(): Date | null {
    return this.cancelledAt;
  }

  public getCreatedAt(): Date {
    return this.createdAt;
  }

  public getUpdatedAt(): Date {
    return this.updatedAt;
  }

  private assertEditable(now: Date): void {
    if (
      this.status !== CheckoutStatus.PENDING &&
      this.status !== CheckoutStatus.CONFIRMING
    ) {
      throw new CanNotUpdateCheckoutStatusException();
    }

    if (this.getExpiresAt() <= now) {
      throw new CheckoutExpiredException();
    }
  }

  private updateShippingInfo(
    shippingName: string,
    shippingAddress: string,
    shippingPhone: string,
  ): void {
    this.shippingName = shippingName;
    this.shippingAddress = shippingAddress;
    this.shippingPhone = shippingPhone;
  }

  private updatePaymentMethod(paymentMethod: PaymentMethod): void {
    this.paymentMethod = paymentMethod;
  }
}
