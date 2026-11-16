export interface IRateLimitStore {
  /** Tăng bộ đếm cho key và trả về giá trị sau khi tăng. */
  increment(key: string, windowSeconds: number): Promise<number>;
}

export const RATE_LIMIT_STORE = 'IRateLimitStore';
