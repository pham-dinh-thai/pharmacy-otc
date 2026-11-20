import { Inject, NotFoundException } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
  INVENTORIES_REPOSITORY,
  type IInventoriesRepository,
} from '../../../domain/inventories.repository';
import { GetBatchQuery } from './get-batch.query';
import { BatchDetailReadModel } from './batch-detail.read-model';
import { batchToDetail } from '../inventory-read-model.factory';

@QueryHandler(GetBatchQuery)
export class GetBatchHandler implements IQueryHandler<
  GetBatchQuery,
  BatchDetailReadModel
> {
  public constructor(
    @Inject(INVENTORIES_REPOSITORY)
    private readonly inventoriesRepository: IInventoriesRepository,
  ) {}

  public async execute(query: GetBatchQuery): Promise<BatchDetailReadModel> {
    const batch = await this.inventoriesRepository.findBatchById(query.id);

    if (!batch) {
      throw new NotFoundException('Batch not found');
    }

    return batchToDetail(batch);
  }
}
