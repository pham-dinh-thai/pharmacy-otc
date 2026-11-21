import { Transform, Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { ExpenseCategory } from '../../../domain/enums/expense-category.enum';
import { PaymentMethod } from '../../../domain/enums/payment-method.enum';

export class CreateExpenseRequest {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name!: string;

  @IsEnum(ExpenseCategory)
  category!: ExpenseCategory;

  @IsInt({ message: 'amount must be an integer in VND' })
  @Min(0)
  amount!: number;

  @Type(() => Date)
  @IsDate()
  expenseDate!: Date;

  @IsOptional()
  @IsUUID('4')
  supplierId!: string | null;

  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod!: PaymentMethod | null;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  note!: string | null;
}
