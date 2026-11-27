import type { Payment } from './payment.aggregate';

export type FindPaymentOptions = {
  forUpdate?: boolean;
};

export interface IPaymentsRepository {
  findById(id: string, options?: FindPaymentOptions): Promise<Payment | null>;

  findByTransactionRef(
    transactionRef: string,
    options?: FindPaymentOptions,
  ): Promise<Payment | null>;

  findByOrderId(orderId: string): Promise<Payment | null>;

  create(payment: Payment): Promise<Payment>;

  update(payment: Payment): Promise<Payment>;
}

export const PAYMENTS_REPOSITORY = 'IPaymentsRepository';
