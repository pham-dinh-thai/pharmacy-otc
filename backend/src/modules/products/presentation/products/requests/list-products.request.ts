import { Transform, Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import {
  parseTriStateFilter,
  trimToNull,
  type TriStateFilter,
} from '../../../../../shared/utils/list-filters';

export class ListProductsRequest {
  @Transform(trimToNull)
  @IsOptional()
  @IsString()
  @MaxLength(255)
  search?: string;

  @Transform(parseTriStateFilter)
  @IsIn(['all', true, false])
  deleted: TriStateFilter = 'all';

  @Transform(trimToNull)
  @IsOptional()
  @IsUUID('4')
  categoryId?: string;

  @Transform(parseTriStateFilter)
  @IsIn(['all', true, false])
  inStock: TriStateFilter = 'all';

  @Transform(trimToNull)
  @IsOptional()
  @Matches(/^\d+$/, { message: 'minPrice must be an integer in VND' })
  minPrice?: string;

  @Transform(trimToNull)
  @IsOptional()
  @Matches(/^\d+$/, { message: 'maxPrice must be an integer in VND' })
  maxPrice?: string;

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
