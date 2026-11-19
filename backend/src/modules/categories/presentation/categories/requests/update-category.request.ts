import { Transform } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

const trim = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

const trimOrNull = ({ value }: { value: unknown }): unknown => {
  if (typeof value !== 'string') return value;

  const trimmed = value.trim();

  return trimmed || null;
};

export class UpdateCategoryRequest {
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name!: string;

  @Transform(trimOrNull)
  @IsOptional()
  @IsString()
  @MaxLength(255)
  slug?: string | null;

  @Transform(trimOrNull)
  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string | null;
}
