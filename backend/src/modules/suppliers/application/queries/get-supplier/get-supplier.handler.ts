import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { SupplierNotFoundException } from '../../../domain/exceptions/supplier.exceptions';
import {
  type ISuppliersRepository,
  SUPPLIERS_REPOSITORY,
} from '../../../domain/suppliers.repository';
import { GetSupplierQuery } from './get-supplier.query';
import { SupplierDetailReadModel } from './supplier-detail.read-model';

@QueryHandler(GetSupplierQuery)
export class GetSupplierHandler implements IQueryHandler<
  GetSupplierQuery,
  SupplierDetailReadModel
> {
  public constructor(
    @Inject(SUPPLIERS_REPOSITORY)
    private readonly suppliersRepository: ISuppliersRepository,
  ) {}

  public async execute(
    query: GetSupplierQuery,
  ): Promise<SupplierDetailReadModel> {
    const supplier = await this.suppliersRepository.findByIdIncludingDeleted(
      query.id,
    );

    if (!supplier) {
      throw new SupplierNotFoundException(query.id);
    }

    return new SupplierDetailReadModel(
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
    );
  }
}
