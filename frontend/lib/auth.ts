import { cookies } from 'next/headers';
import { ACCESS_TOKEN_COOKIE, BACKEND_URL } from './session';

/** Đọc access token từ cookie httpOnly (chỉ dùng ở server). */
export async function getAccessToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(ACCESS_TOKEN_COOKIE)?.value ?? null;
}

/**
 * fetch tới backend kèm Authorization: Bearer <access_token>.
 * path ví dụ: '/roles' → http://localhost/api/roles
 */
export async function authFetch(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const token = await getAccessToken();
  const headers = new Headers(init.headers);

  if (token) headers.set('Authorization', `Bearer ${token}`);

  const url = path.startsWith('http') ? path : `${BACKEND_URL}${path}`;

  return fetch(url, { ...init, headers, cache: 'no-store' });
}
