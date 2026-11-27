import { ConflictException, Injectable } from '@nestjs/common';
import {
  EntityManager,
  LockMode,
  UniqueConstraintViolationException,
} from '@mikro-orm/core';
import type { Payment } from '../../domain/payment.aggregate';
import type {
  FindPaymentOptions,
  IPaymentsRepository,
} from '../../domain/payments.repository';
import { MikroPayment } from '../entities/mikro-payment.entity';
import { PaymentMapper } from '../mappers/payment.mapper';

@Injectable()
export class MikroPaymentsRepository implements IPaymentsRepository {
  public constructor(private readonly entityManager: EntityManager) {}

  public async findById(
    id: string,
    options: FindPaymentOptions = {},
  ): Promise<Payment | null> {
    const mikroPayment = await this.entityManager.findOne(
      MikroPayment,
      { id },
      { lockMode: options.forUpdate ? LockMode.PESSIMISTIC_WRITE : undefined },
    );

    return mikroPayment ? PaymentMapper.toDomain(mikroPayment) : null;
  }

  public async findByTransactionRef(
    transactionRef: string,
    options: FindPaymentOptions = {},
  ): Promise<Payment | null> {
    const mikroPayment = await this.entityManager.findOne(
      MikroPayment,
      { transactionRef },
      { lockMode: options.forUpdate ? LockMode.PESSIMISTIC_WRITE : undefined },
    );

    return mikroPayment ? PaymentMapper.toDomain(mikroPayment) : null;
  }

  public async findByOrderId(orderId: string): Promise<Payment | null> {
    const mikroPayment = await this.entityManager.findOne(MikroPayment, {
      orderId,
    });

    return mikroPayment ? PaymentMapper.toDomain(mikroPayment) : null;
  }

  public async create(payment: Payment): Promise<Payment> {
    try {
      const mikroPayment = PaymentMapper.toMikro(payment);

      this.entityManager.persist(mikroPayment);
      await this.entityManager.flush();

      return PaymentMapper.toDomain(mikroPayment);
    } catch (error) {
      if (error instanceof UniqueConstraintViolationException) {
        throw new ConflictException('Payment already exists');
      }

      throw error;
    }
  }

  public async update(payment: Payment): Promise<Payment> {
    const mikroPayment = this.entityManager.getReference(
      MikroPayment,
      payment.getId(),
    );

    PaymentMapper.assign(mikroPayment, payment);
    await this.entityManager.flush();

    return payment;
  }
}
