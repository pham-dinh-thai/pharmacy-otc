import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
  INVENTORIES_REPOSITORY,
  type IInventoriesRepository,
} from '../../../domain/inventories.repository';
import { GetInventorySummaryQuery } from './get-inventory-summary.query';
import { InventorySummaryPageReadModel } from './inventory-summary-page.read-model';
import { InventorySummaryReadModel } from './inventory-summary.read-model';

@QueryHandler(GetInventorySummaryQuery)
export class GetInventorySummaryHandler implements IQueryHandler<
  GetInventorySummaryQuery,
  InventorySummaryPageReadModel
> {
  public constructor(
    @Inject(INVENTORIES_REPOSITORY)
    private readonly inventoriesRepository: IInventoriesRepository,
  ) {}

  public async execute(
    query: GetInventorySummaryQuery,
  ): Promise<InventorySummaryPageReadModel> {
    const { page, limit } = query;
    const result = await this.inventoriesRepository.findInventorySummaryPage({
      productId: query.productId,
      limit,
      offset: (page - 1) * limit,
    });

    return new InventorySummaryPageReadModel(
      result.items.map(
        (item) =>
          new InventorySummaryReadModel(
            item.productId,
            item.totalQuantity,
            item.batchCount,
            item.nearestExpiry,
            item.stockValue,
            item.updatedAt,
          ),
      ),
      result.total,
      page,
      limit,
    );
  }
}
