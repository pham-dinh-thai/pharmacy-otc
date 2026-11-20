import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  BatchPage,
  FindBatchesFilters,
  FindInventoryOptions,
  FindInventorySummaryFilters,
  IInventoriesRepository,
  InventorySummaryPage,
} from '../../domain/inventories.repository';
import {
  EntityManager,
  type FilterQuery,
  ForeignKeyConstraintViolationException,
  LockMode,
  UniqueConstraintViolationException,
} from '@mikro-orm/core';
import { Batch } from '../../domain/batch/batch.entity';
import { Inventory } from '../../domain/inventory.aggregate';
import { MikroBatch } from '../entities/mikro-batch.entity';
import { MikroInventory } from '../entities/mikro-inventory.entity';
import { BatchMapper } from '../mappers/batch.mapper';
import { likePattern } from '../../../../shared/utils/list-filters';

@Injectable()
export class MikroInventoriesRepository implements IInventoriesRepository {
  public constructor(private readonly entityManager: EntityManager) {}

  public async findInventorySummaryPage(
    filters: FindInventorySummaryFilters = {},
  ): Promise<InventorySummaryPage> {
    const where: FilterQuery<MikroInventory> = {
      ...(filters.productId ? { productId: filters.productId } : {}),
    };

    const [rows, total] = await this.entityManager.findAndCount(
      MikroInventory,
      where,
      {
        orderBy: { updatedAt: 'desc' },
        ...(filters.limit !== undefined ? { limit: filters.limit } : {}),
        ...(filters.offset !== undefined ? { offset: filters.offset } : {}),
      },
    );

    return {
      items: rows.map((row) => ({
        productId: row.productId,
        totalQuantity: row.totalQuantity,
        batchCount: row.batchCount,
        nearestExpiry: row.nearestExpiry,
        stockValue: (row.stockValue ?? 0n).toString(),
        updatedAt: row.updatedAt,
      })),
      total,
    };
  }

  public async findBatchesPage(
    filters: FindBatchesFilters = {},
  ): Promise<BatchPage> {
    const pattern = likePattern(filters.lotNumber ?? undefined);

    const where: FilterQuery<MikroBatch> = {
      ...(filters.productId ? { productId: filters.productId } : {}),
      ...(filters.status && filters.status !== 'all'
        ? { status: filters.status }
        : {}),
      ...(pattern ? { lotNumber: { $ilike: pattern } } : {}),
      ...(filters.expiresBefore
        ? { expiresAt: { $lte: filters.expiresBefore } }
        : {}),
    };

    const [rows, total] = await this.entityManager.findAndCount(
      MikroBatch,
      where,
      {
        orderBy: { expiresAt: 'asc', createdAt: 'asc', id: 'asc' },
        ...(filters.limit !== undefined ? { limit: filters.limit } : {}),
        ...(filters.offset !== undefined ? { offset: filters.offset } : {}),
      },
    );

    return {
      items: rows.map((row) => BatchMapper.toDomain(row)),
      total,
    };
  }

  public async findBatchById(id: string): Promise<Batch | null> {
    const row = await this.entityManager.findOne(MikroBatch, { id });

    return row ? BatchMapper.toDomain(row) : null;
  }

  public async findByProductId(
    productId: string,
    options: FindInventoryOptions = {},
  ): Promise<Inventory | null> {
    const mikroBatches = await this.entityManager.find(
      MikroBatch,
      {
        productId,
      },
      {
        orderBy: { expiresAt: 'asc', createdAt: 'asc', id: 'asc' },
        lockMode: options.forUpdate ? LockMode.PESSIMISTIC_WRITE : undefined,
      },
    );

    if (mikroBatches.length === 0) {
      return null;
    }

    return Inventory.fromPersistent(
      productId,
      mikroBatches.map((mikroBatch) => BatchMapper.toDomain(mikroBatch)),
    );
  }

  public async save(inventory: Inventory): Promise<Inventory> {
    try {
      const news = inventory.getNewBatches();

      if (news.length) {
        await this.entityManager.insertMany(
          MikroBatch,
          news.map((batch) => BatchMapper.toMikroOrm(batch)),
        );
      }

      const updates = [
        ...new Map(
          inventory.getUpdatedBatches().map((batch) => [batch.getId(), batch]),
        ).values(),
      ];

      for (const batch of updates) {
        await this.entityManager.nativeUpdate(
          MikroBatch,
          { id: batch.getId() },
          {
            quantity: batch.getQuantity(),
            updatedAt: batch.getUpdatedAt(),
          },
        );
      }

      return inventory;
    } catch (e) {
      if (e instanceof UniqueConstraintViolationException) {
        throw new ConflictException(
          'Batch already exists for this product and lot number',
        );
      }

      if (e instanceof ForeignKeyConstraintViolationException) {
        throw new NotFoundException('Product not found');
      }

      throw e;
    }
  }
}
