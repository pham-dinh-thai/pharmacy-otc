import { Transform, Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { GoodsReceiptStatus } from '../../../domain/goods-receipt-status.enum';
import { trimToNull } from '../../../../../shared/utils/list-filters';

export class ListGoodsReceiptsRequest {
  @Transform(trimToNull)
  @IsOptional()
  @IsString()
  @MaxLength(255)
  search?: string;

  @IsOptional()
  @IsIn([...Object.values(GoodsReceiptStatus), 'all'])
  status: GoodsReceiptStatus | 'all' = 'all';

  @IsOptional()
  @IsUUID('4')
  supplierId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
