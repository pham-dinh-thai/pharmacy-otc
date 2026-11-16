import Link from 'next/link';
import { Suspense } from 'react';
import { AuthShell } from '@/components/auth/AuthShell';
import { AuthField } from '@/components/auth/AuthField';
import { handleRegister } from './actions';

const ERROR_MESSAGES: Record<string, string> = {
  missing: 'Nhập đầy đủ họ, tên và email rồi gửi lại.',
  short: 'Mật khẩu cần ít nhất 8 ký tự.',
  mismatch: 'Mật khẩu nhập lại không khớp.',
  exists: 'Email này đã được đăng ký. Đăng nhập hoặc dùng email khác.',
  server: 'Không đăng ký được. Kiểm tra kết nối rồi thử lại.',
};

async function RegisterError({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const message = error ? ERROR_MESSAGES[error] : undefined;

  if (!message) return null;

  return (
    <p
      role="alert"
      className="mb-5 border-l-2 border-red-600 bg-red-50 px-3 py-2 text-[13px] leading-5 text-red-700"
    >
      {message}
    </p>
  );
}

export default function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  return (
    <AuthShell
      title="Đăng ký"
      intro="Tạo tài khoản bằng email. Mật khẩu cần ít nhất 8 ký tự."
    >
      <Suspense fallback={null}>
        <RegisterError searchParams={searchParams} />
      </Suspense>

      <form action={handleRegister} className="space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <AuthField
            label="Họ"
            name="lastName"
            autoComplete="family-name"
            required
          />
          <AuthField
            label="Tên"
            name="firstName"
            autoComplete="given-name"
            required
          />
        </div>

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
          autoComplete="new-password"
          minLength={8}
          required
        />

        <AuthField
          label="Nhập lại mật khẩu"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
        />

        <button
          type="submit"
          className="w-full bg-accent py-3 text-[13px] font-semibold text-paper transition-colors hover:bg-ink"
        >
          Tạo tài khoản
        </button>
      </form>

      <p className="mt-6 border-t border-rule pt-4 text-[13px] text-muted">
        Đã có tài khoản?{' '}
        <Link
          href="/login"
          className="underline decoration-rule underline-offset-4 hover:text-accent"
        >
          Đăng nhập
        </Link>
      </p>
    </AuthShell>
  );
}
