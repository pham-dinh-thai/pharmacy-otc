import { SetMetadata } from '@nestjs/common';

export const RATE_LIMIT_KEY = 'rate-limit';

export type RateLimitOptions = {
  /** Số request tối đa trong một cửa sổ thời gian. */
  points: number;
  /** Độ dài cửa sổ tính bằng giây. */
  windowSeconds: number;
  /** Tiền tố key Redis, mặc định lấy theo tên handler. */
  keyPrefix?: string;
  /**
   * Khoá đếm. Vì frontend gọi backend qua BFF, IP luôn là IP của server
   * Next.js, nên endpoint có email nên đếm theo email và endpoint đã xác
   * thực nên đếm theo actor.
   */
  keyBy?: 'ip' | 'email' | 'actor';
};

/**
 * Giới hạn số request theo IP cho một handler. Dùng cho các endpoint
 * nhạy cảm như đăng nhập, đăng ký, quên/đổi mật khẩu.
 */
export const RateLimit = (options: RateLimitOptions) =>
  SetMetadata(RATE_LIMIT_KEY, options);
