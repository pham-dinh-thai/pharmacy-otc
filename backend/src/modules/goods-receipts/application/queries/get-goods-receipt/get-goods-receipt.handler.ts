import { Inject, NotFoundException } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
  GOODS_RECEIPTS_REPOSITORY,
  type IGoodsReceiptsRepository,
} from '../../../domain/goods-receipts.repository';
import { GetGoodsReceiptQuery } from './get-goods-receipt.query';
import { GoodsReceiptDetailReadModel } from './goods-receipt-detail.read-model';
import { goodsReceiptToDetail } from '../goods-receipt-read-model.factory';

@QueryHandler(GetGoodsReceiptQuery)
export class GetGoodsReceiptHandler implements IQueryHandler<
  GetGoodsReceiptQuery,
  GoodsReceiptDetailReadModel
> {
  public constructor(
    @Inject(GOODS_RECEIPTS_REPOSITORY)
    private readonly goodsReceiptsRepository: IGoodsReceiptsRepository,
  ) {}

  public async execute(
    query: GetGoodsReceiptQuery,
  ): Promise<GoodsReceiptDetailReadModel> {
    const receipt = await this.goodsReceiptsRepository.findById(query.id);

    if (!receipt) {
      throw new NotFoundException('Goods receipt not found');
    }

    return goodsReceiptToDetail(receipt);
  }
}
