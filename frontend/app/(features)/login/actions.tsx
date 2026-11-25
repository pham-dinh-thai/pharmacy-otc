'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import {
  ACCESS_TOKEN_COOKIE,
  ACCESS_TOKEN_MAX_AGE,
  BACKEND_URL,
  REFRESH_TOKEN_COOKIE,
  REFRESH_TOKEN_MAX_AGE,
  readSetCookie,
  safeNextPath,
} from '@/lib/session';

const SECURE_COOKIE = process.env.NODE_ENV === 'production';

export async function handleLogin(formData: FormData) {
  const email = String(formData.get('email') ?? '');
  const password = String(formData.get('password') ?? '');
  const next = safeNextPath(String(formData.get('next') ?? '')) ?? '/';

  let res: Response;
  try {
    res = await fetch(`${BACKEND_URL}/authentication/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      cache: 'no-store',
    });
  } catch {
    redirect('/login?error=1');
  }

  if (!res.ok) redirect('/login?error=1');

  const { accessToken, mustChangePassword } = (await res.json()) as {
    accessToken: string;
    mustChangePassword: boolean;
  };
  // Backend chỉ trả refresh token qua Set-Cookie → phải bóc ra để tự set lại.
  const refreshToken = readSetCookie(res.headers, REFRESH_TOKEN_COOKIE);

  const cookieStore = await cookies();

  cookieStore.set(ACCESS_TOKEN_COOKIE, accessToken, {
    httpOnly: true,
    secure: SECURE_COOKIE,
    sameSite: 'lax',
    path: '/',
    maxAge: ACCESS_TOKEN_MAX_AGE,
  });

  if (refreshToken) {
    cookieStore.set(REFRESH_TOKEN_COOKIE, refreshToken, {
      httpOnly: true,
      secure: SECURE_COOKIE,
      sameSite: 'lax',
      path: '/',
      maxAge: REFRESH_TOKEN_MAX_AGE,
    });
  }

  // Tài khoản do admin tạo phải đổi mật khẩu ngay sau lần đăng nhập đầu tiên.
  if (mustChangePassword) redirect('/account/password');

  redirect(next);
}

export async function handleLogout() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get(REFRESH_TOKEN_COOKIE)?.value;

  // Phải thu hồi refresh token ở backend, nếu chỉ xoá cookie thì token vẫn
  // dùng được tới 7 ngày nếu đã bị lộ.
  if (refreshToken) {
    try {
      await fetch(`${BACKEND_URL}/authentication/logout`, {
        method: 'POST',
        headers: { cookie: `${REFRESH_TOKEN_COOKIE}=${refreshToken}` },
        cache: 'no-store',
      });
    } catch {
      // Backend không phản hồi thì vẫn xoá cookie phía trình duyệt.
    }
  }

  cookieStore.delete(ACCESS_TOKEN_COOKIE);
  cookieStore.delete(REFRESH_TOKEN_COOKIE);
  redirect('/login');
}
