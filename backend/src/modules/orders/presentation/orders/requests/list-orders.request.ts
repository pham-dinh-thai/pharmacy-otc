import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { OrderStatus } from '../../../domain/enums/order-status.enum';

export class ListOrdersRequest {
  @IsOptional()
  @IsIn([...Object.values(OrderStatus), 'all'])
  status: OrderStatus | 'all' = 'all';

  @IsOptional()
  @IsString()
  @MaxLength(512)
  cursor?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
