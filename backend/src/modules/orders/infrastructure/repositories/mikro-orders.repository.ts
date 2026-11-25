import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  EntityManager,
  FilterQuery,
  ForeignKeyConstraintViolationException,
  LockMode,
  UniqueConstraintViolationException,
} from '@mikro-orm/core';
import { Order } from '../../domain/order.aggregate';
import type {
  FindOrderOptions,
  FindOrdersFilters,
  IOrdersRepository,
  OrderPage,
} from '../../domain/orders.repository';
import { MikroOrder } from '../entities/mikro-order.entity';
import { MikroOrderLine } from '../entities/mikro-order-line.entity';
import { OrderMapper } from '../mappers/order.mapper';

@Injectable()
export class MikroOrdersRepository implements IOrdersRepository {
  public constructor(private readonly entityManager: EntityManager) {}

  public async findPage(filters: FindOrdersFilters = {}): Promise<OrderPage> {
    const where: FilterQuery<MikroOrder> = {
      ...(filters.userId ? { userId: filters.userId } : {}),
      ...(filters.checkoutId ? { checkoutId: filters.checkoutId } : {}),
      ...(filters.status && filters.status !== 'all'
        ? { status: filters.status }
        : {}),
      ...(filters.paymentStatus && filters.paymentStatus !== 'all'
        ? { paymentStatus: filters.paymentStatus }
        : {}),
    };

    const [rows, total] = await this.entityManager.findAndCount(
      MikroOrder,
      where,
      {
        orderBy: { createdAt: 'desc', id: 'desc' },
        ...(filters.limit !== undefined ? { limit: filters.limit } : {}),
        ...(filters.offset !== undefined ? { offset: filters.offset } : {}),
      },
    );

    if (rows.length === 0) return { items: [], total };

    const mikroLines = await this.entityManager.find(
      MikroOrderLine,
      { orderId: { $in: rows.map((row) => row.id) } },
      { orderBy: { id: 'asc' } },
    );

    const linesByOrder = new Map<string, MikroOrderLine[]>();

    for (const line of mikroLines) {
      const group = linesByOrder.get(line.orderId) ?? [];
      group.push(line);
      linesByOrder.set(line.orderId, group);
    }

    return {
      items: rows.map((row) =>
        OrderMapper.toDomain(row, linesByOrder.get(row.id) ?? []),
      ),
      total,
    };
  }

  public async findById(
    id: string,
    options: FindOrderOptions = {},
  ): Promise<Order | null> {
    const lockMode = options.forUpdate ? LockMode.PESSIMISTIC_WRITE : undefined;

    const mikroOrder = await this.entityManager.findOne(
      MikroOrder,
      { id },
      { lockMode },
    );

    if (!mikroOrder) return null;

    const mikroLines = await this.entityManager.find(
      MikroOrderLine,
      { orderId: id },
      { orderBy: { id: 'asc' }, lockMode },
    );

    return OrderMapper.toDomain(mikroOrder, mikroLines);
  }

  public async findByCheckoutId(checkoutId: string): Promise<Order | null> {
    const mikroOrder = await this.entityManager.findOne(MikroOrder, {
      checkoutId,
    });

    if (!mikroOrder) return null;

    const mikroLines = await this.entityManager.find(MikroOrderLine, {
      orderId: mikroOrder.id,
    });

    return OrderMapper.toDomain(mikroOrder, mikroLines);
  }

  public async create(order: Order): Promise<Order> {
    try {
      const { order: mikroOrder, lines } = OrderMapper.toMikro(order);

      this.entityManager.persist(mikroOrder);
      await this.entityManager.flush();

      this.entityManager.persist(lines);
      await this.entityManager.flush();

      return OrderMapper.toDomain(mikroOrder, lines);
    } catch (error) {
      if (error instanceof UniqueConstraintViolationException) {
        throw new ConflictException('Order already exists for this checkout');
      }

      if (error instanceof ForeignKeyConstraintViolationException) {
        throw new NotFoundException('User or product not found');
      }

      throw error;
    }
  }

  public async update(order: Order): Promise<Order> {
    const mikroOrder = this.entityManager.getReference(
      MikroOrder,
      order.getId(),
    );

    OrderMapper.assign(mikroOrder, order);
    await this.entityManager.flush();

    return order;
  }
}
