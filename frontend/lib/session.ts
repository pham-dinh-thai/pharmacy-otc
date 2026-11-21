/**
 * Cookie/token helpers dùng chung cho server action, route handler và proxy.
 * Không import `next/headers` ở đây để proxy có thể dùng an toàn.
 */

export const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost/api';

export const ACCESS_TOKEN_COOKIE = 'access_token';
export const REFRESH_TOKEN_COOKIE = 'refresh_token';
export const CART_COOKIE = 'cart_id';
export const CART_COOKIE_MAX_AGE = 30 * 24 * 60 * 60;

export const ACCESS_TOKEN_MAX_AGE = 15 * 60; // 15 phút, khớp JWT_ACCESS_EXPIRES_IN
export const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60; // 7 ngày, khớp JWT_REFRESH_EXPIRES_IN

/** Lấy giá trị 1 cookie từ header Set-Cookie (fetch của Node không có cookie jar). */
export function readSetCookie(headers: Headers, name: string): string | null {
  for (const setCookie of headers.getSetCookie()) {
    const [pair] = setCookie.split(';');
    const separator = pair.indexOf('=');
    if (separator === -1) continue;
    if (pair.slice(0, separator).trim() !== name) continue;
    return pair.slice(separator + 1).trim();
  }
  return null;
}

export type RefreshedTokens = {
  accessToken: string;
  refreshToken: string | null;
};

/** Gọi backend /authentication/refresh bằng refresh token đang có. */
export async function requestNewAccessToken(
  refreshToken: string,
): Promise<RefreshedTokens | null> {
  let res: Response;
  try {
    res = await fetch(`${BACKEND_URL}/authentication/refresh`, {
      method: 'POST',
      headers: { cookie: `${REFRESH_TOKEN_COOKIE}=${refreshToken}` },
      cache: 'no-store',
    });
  } catch {
    return null;
  }

  if (!res.ok) return null;

  const { accessToken } = (await res.json()) as { accessToken: string };

  return {
    accessToken,
    refreshToken: readSetCookie(res.headers, REFRESH_TOKEN_COOKIE),
  };
}
