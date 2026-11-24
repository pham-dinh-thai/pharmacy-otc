import { Transform } from 'class-transformer';
import { IsOptional, IsString, MaxLength } from 'class-validator';

const trimToNull = ({ value }: { value: unknown }): unknown => {
  if (typeof value !== 'string') return value;

  const trimmed = value.trim();
  return trimmed || null;
};

export class SaveCustomerDeliveryContactRequest {
  @Transform(trimToNull)
  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string | null;

  @Transform(trimToNull)
  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string | null;
}
