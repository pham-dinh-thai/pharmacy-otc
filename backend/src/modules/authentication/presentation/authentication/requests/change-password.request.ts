import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

// Không trim mật khẩu: khoảng trắng đầu/cuối là một phần của secret.
export class ChangePasswordRequest {
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  @MinLength(8)
  currentPassword!: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  @MinLength(8)
  newPassword!: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  @MinLength(8)
  newPasswordConfirmation!: string;
}
