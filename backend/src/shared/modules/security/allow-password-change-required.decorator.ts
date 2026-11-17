import { SetMetadata } from '@nestjs/common';

export const ALLOW_PASSWORD_CHANGE_REQUIRED = 'allow-password-change-required';

/**
 * Cho phép endpoint chạy dù account đang bị ép đổi mật khẩu.
 * Chỉ dùng cho các endpoint auth (/me, đổi mật khẩu, logout) để người dùng
 * có thể tự thoát khỏi trạng thái này.
 */
export const AllowPasswordChangeRequired = () =>
  SetMetadata(ALLOW_PASSWORD_CHANGE_REQUIRED, true);
