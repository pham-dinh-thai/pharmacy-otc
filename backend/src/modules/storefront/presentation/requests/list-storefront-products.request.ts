import { Transform, Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { trimToNull } from '../../../../shared/utils/list-filters';

export class ListStorefrontProductsRequest {
  @Transform(trimToNull)
  @IsOptional()
  @IsString()
  @MaxLength(255)
  q?: string;

  @Transform(trimToNull)
  @IsOptional()
  @IsUUID('4')
  category?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 20;
}
