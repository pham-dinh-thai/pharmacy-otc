import { Transform, type TransformFnParams } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
} from 'class-validator';

const trim = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

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

  @IsInt()
  @IsNotEmpty()
  quantity!: number;

  @Transform(trimCategoryIds)
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  categoryIds?: string[];
}
