import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { CustomerProfileRequest } from './customer-profile.request';

const trim = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

export class RegisterRequest extends CustomerProfileRequest {
  @Transform(trim)
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  firstName!: string;

  @Transform(trim)
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  lastName!: string;

  @Transform(trim)
  @IsNotEmpty()
  @IsEmail()
  @MaxLength(255)
  email!: string;

  // Không trim mật khẩu: khoảng trắng đầu/cuối là một phần của secret.
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  password!: string;
}
