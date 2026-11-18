import { ConflictException, Injectable } from '@nestjs/common';
import {
  EntityManager,
  type FilterQuery,
  UniqueConstraintViolationException,
} from '@mikro-orm/core';
import {
  type FindSuppliersFilters,
  ISuppliersRepository,
} from '../../domain/suppliers.repository';
import { Supplier } from '../../domain/supplier.aggregate';
import { SupplierMapper } from '../mappers/supplier.mapper';
import { MikroSupplier } from '../entities/mikro-supplier.entity';

const escapeLikePattern = (value: string): string =>
  value.replace(/[\\%_]/g, '\\$&');

@Injectable()
export class MikroSuppliersRepository implements ISuppliersRepository {
  public constructor(private readonly entityManager: EntityManager) {}

  public async findPage(
    filters?: FindSuppliersFilters,
  ): Promise<{ items: Supplier[]; total: number }> {
    const search = filters?.search?.trim();
    const pattern = search ? `%${escapeLikePattern(search)}%` : undefined;

    const deleted = filters?.deleted ?? false;

    const where: FilterQuery<MikroSupplier> = {
      deletedAt: deleted ? { $ne: null } : null,
      ...(pattern
        ? {
            $or: [
              { code: { $ilike: pattern } },
              { name: { $ilike: pattern } },
              { phone: { $ilike: pattern } },
              { email: { $ilike: pattern } },
              { taxCode: { $ilike: pattern } },
            ],
          }
        : {}),
    };

    const [mikroSuppliers, total] = await this.entityManager.findAndCount(
      MikroSupplier,
      where,
      {
        orderBy: { createdAt: 'desc' },
        ...(filters?.limit !== undefined ? { limit: filters.limit } : {}),
        ...(filters?.offset !== undefined ? { offset: filters.offset } : {}),
      },
    );

    return {
      items: mikroSuppliers.map((mikroSupplier) =>
        SupplierMapper.toDomain(mikroSupplier),
      ),
      total,
    };
  }

  public async findById(id: string): Promise<Supplier | null> {
    const mikroSupplier = await this.entityManager.findOne(MikroSupplier, {
      id,
      deletedAt: null,
    });

    return mikroSupplier ? SupplierMapper.toDomain(mikroSupplier) : null;
  }

  public async findByIdIncludingDeleted(id: string): Promise<Supplier | null> {
    const mikroSupplier = await this.entityManager.findOne(MikroSupplier, {
      id,
    });

    return mikroSupplier ? SupplierMapper.toDomain(mikroSupplier) : null;
  }

  public async nextSequence(): Promise<number> {
    const rows = (await this.entityManager
      .getConnection()
      .execute(`select nextval('supplier_code_seq') as nextval`)) as {
      nextval: string;
    }[];

    return Number(rows[0].nextval);
  }

  public create(supplier: Supplier): Promise<Supplier> {
    return this.persistSupplier(new MikroSupplier(), supplier, true);
  }

  public update(supplier: Supplier): Promise<Supplier> {
    const mikroSupplier = this.entityManager.getReference(
      MikroSupplier,
      supplier.getId(),
    );

    return this.persistSupplier(mikroSupplier, supplier, false);
  }

  private async persistSupplier(
    mikroSupplier: MikroSupplier,
    supplier: Supplier,
    insert: boolean,
  ): Promise<Supplier> {
    try {
      SupplierMapper.assign(mikroSupplier, supplier);

      if (insert) {
        this.entityManager.persist(mikroSupplier);
      }

      await this.entityManager.flush();

      return SupplierMapper.toDomain(mikroSupplier);
    } catch (e) {
      if (e instanceof UniqueConstraintViolationException) {
        throw new ConflictException('Supplier code or tax code already exists');
      }

      throw e;
    }
  }
}
