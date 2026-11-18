import { Transform } from 'class-transformer';
import { EmployeePosition } from '../../../domain/enums/employee-position.enum';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

const trim = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

export class CreateEmployeeRequest {
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  firstName!: string;

  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  lastName!: string;

  @Transform(trim)
  @IsString()
  @IsEmail()
  @MaxLength(255)
  email!: string;

  // Không trim mật khẩu: khoảng trắng đầu/cuối là một phần của secret.
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(128)
  password!: string;

  @Transform(trim)
  @IsUUID('4')
  departmentId!: string;

  @Transform(trim)
  @IsOptional()
  @IsEnum(EmployeePosition)
  position?: EmployeePosition | null;
}
