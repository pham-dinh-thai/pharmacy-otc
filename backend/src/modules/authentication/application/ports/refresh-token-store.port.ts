export interface IRefreshTokenStorePort {
  save(
    sub: string,
    jti: string,
    token: string,
    ttlSeconds: number,
  ): Promise<void>;

  matches(sub: string, jti: string, refreshToken: string): Promise<boolean>;

  revoke(sub: string, jti: string): Promise<void>;

  /** Thu hồi toàn bộ refresh token của một user (đổi/reset mật khẩu, logout all). */
  revokeAll(sub: string): Promise<void>;
}

export const REFRESH_TOKEN_STORE_PORT = 'IRefreshTokenStorePort';
