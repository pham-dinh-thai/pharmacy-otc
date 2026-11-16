import Link from 'next/link';
import { cookies } from 'next/headers';
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from '@/lib/session';
import { handleLogout } from '@/app/(features)/login/actions';

/**
 * Server component để đọc cookie httpOnly và hiển thị đúng trạng thái đăng
 * nhập. Phải nằm trong <Suspense> vì đọc cookies() là dữ liệu động.
 */
export async function HeaderAuth() {
  const cookieStore = await cookies();
  const isLoggedIn = Boolean(
    cookieStore.get(ACCESS_TOKEN_COOKIE)?.value ??
    cookieStore.get(REFRESH_TOKEN_COOKIE)?.value,
  );

  if (!isLoggedIn) {
    return (
      <Link href="/login" className="hover:text-accent">
        Đăng nhập
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-4 sm:gap-5">
      <Link href="/account/password" className="hover:text-accent">
        <span className="sm:hidden">Tài khoản</span>
        <span className="hidden sm:inline">Đổi mật khẩu</span>
      </Link>
      <form action={handleLogout}>
        <button type="submit" className="hover:text-accent">
          <span className="sm:hidden">Thoát</span>
          <span className="hidden sm:inline">Đăng xuất</span>
        </button>
      </form>
    </div>
  );
}
