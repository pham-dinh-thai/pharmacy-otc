import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
  INVENTORIES_REPOSITORY,
  type IInventoriesRepository,
} from '../../../domain/inventories.repository';
import { GetBatchesQuery } from './get-batches.query';
import { BatchListPageReadModel } from './batch-list-page.read-model';
import { batchToListItem } from '../inventory-read-model.factory';

@QueryHandler(GetBatchesQuery)
export class GetBatchesHandler implements IQueryHandler<
  GetBatchesQuery,
  BatchListPageReadModel
> {
  public constructor(
    @Inject(INVENTORIES_REPOSITORY)
    private readonly inventoriesRepository: IInventoriesRepository,
  ) {}

  public async execute(
    query: GetBatchesQuery,
  ): Promise<BatchListPageReadModel> {
    const { page, limit } = query;
    const result = await this.inventoriesRepository.findBatchesPage({
      productId: query.productId,
      lotNumber: query.lotNumber,
      status: query.status,
      expiresBefore: query.expiresBefore,
      limit,
      offset: (page - 1) * limit,
    });

    return new BatchListPageReadModel(
      result.items.map((batch) => batchToListItem(batch)),
      result.total,
      page,
      limit,
    );
  }
}
