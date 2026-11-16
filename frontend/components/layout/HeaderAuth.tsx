import Link from 'next/link';
import { cookies } from 'next/headers';
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from '@/lib/session';
import {
  canAccessAdmin,
  canAccessStaff,
  fetchCurrentUser,
} from '@/lib/account';
import { AccountMenu } from './AccountMenu';

/**
 * Server component đọc cookie httpOnly rồi hiển thị menu tài khoản. Phải nằm
 * trong <Suspense> vì đọc cookies() là dữ liệu động.
 */
export async function HeaderAuth() {
  const cookieStore = await cookies();
  const hasSession = Boolean(
    cookieStore.get(ACCESS_TOKEN_COOKIE)?.value ??
    cookieStore.get(REFRESH_TOKEN_COOKIE)?.value,
  );

  if (!hasSession) {
    return (
      <Link href="/login" className="hover:text-accent">
        Đăng nhập
      </Link>
    );
  }

  // Access token có thể đã hết hạn trong khi refresh token còn sống. Khi đó
  // /me trả 401 và menu chỉ hiện các mục cơ bản; proxy sẽ tự refresh khi
  // người dùng mở một trang được bảo vệ.
  const user = await fetchCurrentUser();

  return (
    <AccountMenu
      canAccessAdmin={user ? canAccessAdmin(user) : false}
      canAccessStaff={user ? canAccessStaff(user) : false}
    />
  );
}
