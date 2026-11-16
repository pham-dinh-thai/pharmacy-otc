import Link from 'next/link';
import { Suspense } from 'react';
import { AuthShell } from '@/components/auth/AuthShell';
import { AuthField } from '@/components/auth/AuthField';
import { handleLogin } from './actions';

const ERROR_MESSAGE =
  'Email hoặc mật khẩu không đúng. Kiểm tra lại rồi thử lại.';

async function LoginMessages({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string;
    registered?: string;
    passwordChanged?: string;
  }>;
}) {
  const { error, registered, passwordChanged } = await searchParams;

  if (passwordChanged) {
    return (
      <p
        role="status"
        className="mb-5 border-l-2 border-accent bg-accent-soft px-3 py-2 text-[13px] leading-5 text-accent"
      >
        Đã đổi mật khẩu. Đăng nhập lại bằng mật khẩu mới.
      </p>
    );
  }

  if (registered) {
    return (
      <p
        role="status"
        className="mb-5 border-l-2 border-accent bg-accent-soft px-3 py-2 text-[13px] leading-5 text-accent"
      >
        Đăng ký thành công. Đăng nhập bằng email vừa tạo.
      </p>
    );
  }

  if (error) {
    return (
      <p
        role="alert"
        className="mb-5 border-l-2 border-red-600 bg-red-50 px-3 py-2 text-[13px] leading-5 text-red-700"
      >
        {ERROR_MESSAGE}
      </p>
    );
  }

  return null;
}

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string;
    registered?: string;
    passwordChanged?: string;
  }>;
}) {
  return (
    <AuthShell title="Đăng nhập" intro="Nhập email và mật khẩu để tiếp tục.">
      <Suspense fallback={null}>
        <LoginMessages searchParams={searchParams} />
      </Suspense>

      <form action={handleLogin} className="space-y-5">
        <AuthField
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="ban@example.com"
          required
        />

        <AuthField
          label="Mật khẩu"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />

        <button
          type="submit"
          className="w-full bg-accent py-3 text-[13px] font-semibold text-paper transition-colors hover:bg-ink"
        >
          Đăng nhập
        </button>
      </form>

      <p className="mt-6 border-t border-rule pt-4 text-[13px] text-muted">
        Chưa có tài khoản?{' '}
        <Link
          href="/register"
          className="underline decoration-rule underline-offset-4 hover:text-accent"
        >
          Đăng ký
        </Link>
      </p>
    </AuthShell>
  );
}
