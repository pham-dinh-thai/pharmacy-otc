import { Transform, type TransformFnParams } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsNotEmpty,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

const trim = ({ value }: TransformFnParams): unknown =>
  typeof value === 'string' ? value.trim() : value;

export class CreateCheckoutRequest {
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  productIds!: string[];

  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  shippingName!: string;

  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  shippingAddress!: string;

  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  shippingPhone!: string;
}
