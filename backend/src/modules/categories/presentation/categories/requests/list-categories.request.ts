import { Transform, Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import {
  parseTriStateFilter,
  trimToNull,
  type TriStateFilter,
} from '../../../../../shared/utils/list-filters';

export class ListCategoriesRequest {
  @Transform(trimToNull)
  @IsOptional()
  @IsString()
  @MaxLength(255)
  search?: string;

  @Transform(parseTriStateFilter)
  @IsIn(['all', true, false])
  deleted: TriStateFilter = 'all';

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
