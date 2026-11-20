import { Transform, type TransformFnParams } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
} from 'class-validator';

const trim = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

const trimOrNull = ({ value }: TransformFnParams): unknown => {
  if (typeof value !== 'string') return value;

  const trimmed = value.trim();

  return trimmed || null;
};

const trimCategoryIds = ({ value }: TransformFnParams): unknown => {
  if (!Array.isArray(value)) return value;

  const ids: unknown[] = value;

  return ids
    .map((id) => (typeof id === 'string' ? id.trim() : id))
    .filter((id) => id !== '');
};

export class UpdateProductRequest {
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  name!: string;

  @Matches(/^\d+$/, { message: 'unitPrice must be an integer in VND' })
  @IsNotEmpty()
  unitPrice!: string;

  @Transform(trimOrNull)
  @IsOptional()
  @IsString()
  @MaxLength(100)
  sku?: string | null;

  @Transform(trimOrNull)
  @IsOptional()
  @IsString()
  @MaxLength(50)
  unit?: string | null;

  @Transform(trimOrNull)
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string | null;

  @Transform(trimOrNull)
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  imageUrl?: string | null;

  @Transform(trimOrNull)
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  warning?: string | null;

  @Transform(trimCategoryIds)
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  categoryIds?: string[];
}
