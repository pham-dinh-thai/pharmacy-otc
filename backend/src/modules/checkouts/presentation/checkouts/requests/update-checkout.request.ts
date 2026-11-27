import { Transform, type TransformFnParams } from 'class-transformer';
import { IsIn, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import {
  PAYMENT_METHODS,
  PaymentMethod,
} from '../../../../../shared/domain/enums/payment-method.enum';

const trim = ({ value }: TransformFnParams): unknown =>
  typeof value === 'string' ? value.trim() : value;

export class UpdateCheckoutRequest {
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

  @IsIn(PAYMENT_METHODS)
  paymentMethod!: PaymentMethod;
}
