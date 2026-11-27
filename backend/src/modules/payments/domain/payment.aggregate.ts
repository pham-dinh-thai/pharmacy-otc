import { Id } from '../../../shared/domain/value-objects/id.value-object';
import { Money } from '../../../shared/domain/value-objects/money.value-object';
import { PaymentProvider } from './enums/payment-provider.enum';
import { PaymentStatus } from './enums/payment-status.enum';
import {
  PaymentInvalidNotificationException,
  PaymentInvalidStatusException,
} from './exceptions/payment.exception';
import type { PaymentGateway } from './payment-gateway';

export type { PaymentGateway, PaymentGatewayField } from './payment-gateway';

export type PaymentSettlement = {
  providerTransactionNo: string | null;
  bankCode: string | null;
  responseCode: string | null;
  payload: Record<string, unknown>;
};

export type CreatePaymentProps = {
  orderId: string;
  provider: PaymentProvider;
  amount: bigint;
  transactionRef: string;
  gateway: PaymentGateway;
  expiresAt?: Date | null;
};

export type FromPersistentPaymentProps = {
  id: string;
  orderId: string;
  provider: PaymentProvider;
  amount: bigint;
  transactionRef: string;
  gateway: PaymentGateway | null;
  status: PaymentStatus;
  settlement: PaymentSettlement | null;
  expiresAt: Date | null;
  paidAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export class Payment {
  private constructor(
    private readonly id: Id,
    private readonly orderId: string,
    private readonly provider: PaymentProvider,
    private readonly amount: Money,
    private readonly transactionRef: string,
    private readonly gateway: PaymentGateway | null,
    private status: PaymentStatus,
    private settlement: PaymentSettlement | null,
    private readonly expiresAt: Date | null,
    private paidAt: Date | null,
    private readonly createdAt: Date,
    private updatedAt: Date,
  ) {}

  public static create(props: CreatePaymentProps): Payment {
    const now = new Date();

    return new Payment(
      Id.generateV7(),
      Id.create(props.orderId).toString(),
      props.provider,
      Money.create(props.amount),
      Payment.assertTransactionRef(props.transactionRef),
      props.gateway,
      PaymentStatus.PENDING,
      null,
      props.expiresAt ?? null,
      null,
      now,
      now,
    );
  }

  public static fromPersistent(props: FromPersistentPaymentProps): Payment {
    return new Payment(
      Id.create(props.id),
      Id.create(props.orderId).toString(),
      props.provider,
      Money.create(props.amount),
      props.transactionRef,
      props.gateway,
      props.status,
      props.settlement,
      props.expiresAt ?? null,
      props.paidAt,
      props.createdAt,
      props.updatedAt,
    );
  }

  public markSucceeded(settlement: PaymentSettlement, now = new Date()): void {
    if (this.status === PaymentStatus.SUCCESS) return;

    if (this.status !== PaymentStatus.PENDING) {
      throw new PaymentInvalidStatusException(this.status);
    }

    this.status = PaymentStatus.SUCCESS;
    this.settlement = settlement;
    this.paidAt = now;
    this.updatedAt = now;
  }

  public getId(): string {
    return this.id.toString();
  }

  public getOrderId(): string {
    return this.orderId;
  }

  public getProvider(): PaymentProvider {
    return this.provider;
  }

  public getAmount(): bigint {
    return this.amount.toBigInt();
  }

  public getTransactionRef(): string {
    return this.transactionRef;
  }

  public getGateway(): PaymentGateway | null {
    if (!this.gateway) return null;

    return {
      url: this.gateway.url,
      fields: this.gateway.fields.map((field) => ({ ...field })),
    };
  }

  public getStatus(): PaymentStatus {
    return this.status;
  }

  public getSettlement(): PaymentSettlement | null {
    return this.settlement;
  }

  public getExpiresAt(): Date | null {
    return this.expiresAt;
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

  private static assertTransactionRef(ref: string): string {
    const value = ref.trim();

    if (!value) {
      throw new PaymentInvalidNotificationException(
        'Payment transaction reference is required',
      );
    }

    return value;
  }
}
