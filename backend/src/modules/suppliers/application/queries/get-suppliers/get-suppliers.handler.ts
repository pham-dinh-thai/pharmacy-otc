import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
  type ISuppliersRepository,
  SUPPLIERS_REPOSITORY,
} from '../../../domain/suppliers.repository';
import { GetSuppliersQuery } from './get-suppliers.query';
import { SupplierListItemReadModel } from './supplier-list-item.read-model';
import { SupplierListPageReadModel } from './supplier-list-page.read-model';

@QueryHandler(GetSuppliersQuery)
export class GetSuppliersHandler implements IQueryHandler<
  GetSuppliersQuery,
  SupplierListPageReadModel
> {
  public constructor(
    @Inject(SUPPLIERS_REPOSITORY)
    private readonly suppliersRepository: ISuppliersRepository,
  ) {}

  public async execute(
    query: GetSuppliersQuery,
  ): Promise<SupplierListPageReadModel> {
    const { page, limit } = query;
    const result = await this.suppliersRepository.findPage({
      deleted: query.deleted,
      search: query.search,
      limit,
      offset: (page - 1) * limit,
    });

    return new SupplierListPageReadModel(
      result.items.map(
        (supplier) =>
          new SupplierListItemReadModel(
            supplier.getId(),
            supplier.getCode(),
            supplier.getName(),
            supplier.getPhone(),
            supplier.getEmail(),
            supplier.getAddress(),
            supplier.getTaxCode(),
            supplier.getCreatedAt(),
            supplier.getUpdatedAt(),
            supplier.getDeletedAt(),
          ),
      ),
      result.total,
      page,
      limit,
    );
  }
}
