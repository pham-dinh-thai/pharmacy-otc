import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
  GOODS_RECEIPTS_REPOSITORY,
  type IGoodsReceiptsRepository,
} from '../../../domain/goods-receipts.repository';
import { GetGoodsReceiptsQuery } from './get-goods-receipts.query';
import { GoodsReceiptListPageReadModel } from './goods-receipt-list-page.read-model';
import { goodsReceiptToListItem } from '../goods-receipt-read-model.factory';

@QueryHandler(GetGoodsReceiptsQuery)
export class GetGoodsReceiptsHandler implements IQueryHandler<
  GetGoodsReceiptsQuery,
  GoodsReceiptListPageReadModel
> {
  public constructor(
    @Inject(GOODS_RECEIPTS_REPOSITORY)
    private readonly goodsReceiptsRepository: IGoodsReceiptsRepository,
  ) {}

  public async execute(
    query: GetGoodsReceiptsQuery,
  ): Promise<GoodsReceiptListPageReadModel> {
    const { page, limit } = query;
    const result = await this.goodsReceiptsRepository.findPage({
      search: query.search,
      status: query.status,
      supplierId: query.supplierId,
      limit,
      offset: (page - 1) * limit,
    });

    return new GoodsReceiptListPageReadModel(
      result.items.map((receipt) => goodsReceiptToListItem(receipt)),
      result.total,
      page,
      limit,
    );
  }
}
