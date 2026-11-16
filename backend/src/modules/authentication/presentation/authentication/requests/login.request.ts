import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class LoginRequest {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsNotEmpty()
  @IsEmail()
  @MaxLength(255)
  email!: string;

  // Không trim mật khẩu: khoảng trắng đầu/cuối là một phần của secret.
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  @MinLength(8)
  password!: string;
}
