import {
  EntityManager,
  ForeignKeyConstraintViolationException,
  LockMode,
} from '@mikro-orm/core';
import { Injectable, NotFoundException } from '@nestjs/common';
import { Checkout } from '../../domain/checkout.aggregate';
import type {
  CheckoutPage,
  FindCheckoutOptions,
  FindCheckoutsFilters,
  ICheckoutRepository,
} from '../../domain/checkouts.repository';
import { MikroCheckout } from '../entities/mikro-checkout.entity';
import { MikroCheckoutLine } from '../entities/mikro-checkout-line.entity';
import { CheckoutMapper } from '../mappers/checkout.mapper';

@Injectable()
export class MikroCheckoutsRepository implements ICheckoutRepository {
  public constructor(private readonly entityManager: EntityManager) {}

  public async findPage(
    filters: FindCheckoutsFilters = {},
  ): Promise<CheckoutPage> {
    const where = {
      ...(filters.userId ? { userId: filters.userId } : {}),
      ...(filters.status && filters.status !== 'all'
        ? { status: filters.status }
        : {}),
    };

    const [rows, total] = await this.entityManager.findAndCount(
      MikroCheckout,
      where,
      {
        orderBy: { createdAt: 'desc', id: 'desc' },
        ...(filters.limit !== undefined ? { limit: filters.limit } : {}),
        ...(filters.offset !== undefined ? { offset: filters.offset } : {}),
      },
    );

    if (rows.length === 0) return { items: [], total };

    const mikroLines = await this.entityManager.find(
      MikroCheckoutLine,
      { checkoutId: { $in: rows.map((row) => row.id) } },
      { orderBy: { id: 'asc' } },
    );

    const linesByCheckout = new Map<string, MikroCheckoutLine[]>();

    for (const line of mikroLines) {
      const group = linesByCheckout.get(line.checkoutId) ?? [];
      group.push(line);
      linesByCheckout.set(line.checkoutId, group);
    }

    return {
      items: rows.map((row) =>
        CheckoutMapper.toDomain(row, linesByCheckout.get(row.id) ?? []),
      ),
      total,
    };
  }

  public async findById(
    id: string,
    options: FindCheckoutOptions = {},
  ): Promise<Checkout | null> {
    const lockMode = options.forUpdate ? LockMode.PESSIMISTIC_WRITE : undefined;

    const mikroCheckout = await this.entityManager.findOne(
      MikroCheckout,
      { id },
      { lockMode },
    );

    if (!mikroCheckout) return null;

    const mikroLines = await this.entityManager.find(
      MikroCheckoutLine,
      { checkoutId: id },
      { orderBy: { id: 'asc' }, lockMode },
    );

    return CheckoutMapper.toDomain(mikroCheckout, mikroLines);
  }

  public async create(checkout: Checkout): Promise<Checkout> {
    try {
      const { checkout: mikroCheckout, lines } =
        CheckoutMapper.toMikro(checkout);

      this.entityManager.persist(mikroCheckout);
      await this.entityManager.flush();

      this.entityManager.persist(lines);
      await this.entityManager.flush();

      return CheckoutMapper.toDomain(mikroCheckout, lines);
    } catch (error) {
      if (error instanceof ForeignKeyConstraintViolationException) {
        throw new NotFoundException('User or product not found');
      }

      throw error;
    }
  }

  public async update(checkout: Checkout): Promise<Checkout> {
    const mikroCheckout = this.entityManager.getReference(
      MikroCheckout,
      checkout.getId(),
    );

    CheckoutMapper.assign(mikroCheckout, checkout);
    await this.entityManager.flush();

    return checkout;
  }
}
