import { NextRequest, NextResponse } from 'next/server';
import {
  ACCESS_TOKEN_COOKIE,
  ACCESS_TOKEN_MAX_AGE,
  REFRESH_TOKEN_COOKIE,
  REFRESH_TOKEN_MAX_AGE,
  requestNewAccessToken,
} from '@/lib/session';

const SECURE_COOKIE = process.env.NODE_ENV === 'production';

function redirectToLogin(request: NextRequest) {
  const url = new URL('/login', request.url);
  url.searchParams.set('next', request.nextUrl.pathname);
  return NextResponse.redirect(url);
}

/**
 * Trước khi vào route bảo vệ: nếu không có access token thì thử refresh.
 * Refresh thất bại → về /login.
 */
export async function proxy(request: NextRequest) {
  const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  if (accessToken) return NextResponse.next();

  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;
  if (!refreshToken) return redirectToLogin(request);

  const refreshed = await requestNewAccessToken(refreshToken);

  if (!refreshed) {
    const response = redirectToLogin(request);
    response.cookies.delete(REFRESH_TOKEN_COOKIE);
    return response;
  }

  // Cho Server Component của request hiện tại thấy token mới.
  request.cookies.set(ACCESS_TOKEN_COOKIE, refreshed.accessToken);
  const response = NextResponse.next({
    request: { headers: request.headers },
  });

  response.cookies.set(ACCESS_TOKEN_COOKIE, refreshed.accessToken, {
    httpOnly: true,
    secure: SECURE_COOKIE,
    sameSite: 'lax',
    path: '/',
    maxAge: ACCESS_TOKEN_MAX_AGE,
  });

  // Backend xoay vòng refresh token mỗi lần refresh → phải lưu bản mới.
  if (refreshed.refreshToken) {
    response.cookies.set(REFRESH_TOKEN_COOKIE, refreshed.refreshToken, {
      httpOnly: true,
      secure: SECURE_COOKIE,
      sameSite: 'lax',
      path: '/',
      maxAge: REFRESH_TOKEN_MAX_AGE,
    });
  }

  return response;
}

export const config = {
  matcher: [
    '/roles/:path*',
    '/account/:path*',
    '/admin/:path*',
    '/staff/:path*',
  ],
};
