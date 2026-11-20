import { Transform, Type } from 'class-transformer';
import {
  IsDate,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { BatchStatus } from '../../../domain/batch/batch-status.enum';
import { trimToNull } from '../../../../../shared/utils/list-filters';

const toDate = ({ value }: { value: unknown }): unknown => {
  if (typeof value !== 'string' || !value.trim()) return undefined;

  return new Date(value);
};

export class ListBatchesRequest {
  @IsOptional()
  @IsUUID('4')
  productId?: string;

  @Transform(trimToNull)
  @IsOptional()
  @IsString()
  @MaxLength(50)
  lotNumber?: string;

  @IsOptional()
  @IsIn([...Object.values(BatchStatus), 'all'])
  status: BatchStatus | 'all' = 'all';

  @Transform(toDate)
  @IsOptional()
  @IsDate()
  expiresBefore?: Date;

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
