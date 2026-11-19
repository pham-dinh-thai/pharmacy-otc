import Link from 'next/link';
import { Suspense } from 'react';
import { AuthShell } from '@/components/auth/AuthShell';
import { AuthField } from '@/components/auth/AuthField';
import { CUSTOMER_GENDERS } from '@/lib/customers';
import { handleRegister } from './actions';

const ERROR_MESSAGES: Record<string, string> = {
  missing: 'Nhập đầy đủ họ, tên và email rồi gửi lại.',
  short: 'Mật khẩu cần ít nhất 8 ký tự.',
  mismatch: 'Mật khẩu nhập lại không khớp.',
  profile:
    'Cần chọn giới tính, ngày sinh và nhập ít nhất một số điện thoại cùng một địa chỉ giao hàng.',
  invalid: 'Thông tin hồ sơ không hợp lệ. Kiểm tra lại rồi gửi lại.',
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

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label
              htmlFor="gender"
              className="mb-1.5 block text-[13px] font-medium text-muted"
            >
              Giới tính
            </label>
            <select
              id="gender"
              name="gender"
              required
              defaultValue=""
              className="w-full border border-rule bg-paper px-3 py-2.5 text-[14px] focus:border-ink"
            >
              <option value="">Chọn giới tính</option>
              {CUSTOMER_GENDERS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="dateOfBirth"
              className="mb-1.5 block text-[13px] font-medium text-muted"
            >
              Ngày sinh
            </label>
            <input
              id="dateOfBirth"
              name="dateOfBirth"
              type="date"
              required
              className="w-full border border-rule bg-paper px-3 py-2.5 text-[14px] focus:border-ink"
            />
          </div>
        </div>

        <AuthField
          label="Số điện thoại"
          name="phone"
          type="text"
          autoComplete="tel"
          placeholder="Số điện thoại liên hệ"
          required
        />

        <div>
          <label
            htmlFor="address"
            className="mb-1.5 block text-[13px] font-medium text-muted"
          >
            Địa chỉ giao hàng
          </label>
          <input
            id="address"
            name="address"
            type="text"
            autoComplete="street-address"
            required
            maxLength={500}
            placeholder="Địa chỉ giao hàng"
            className="w-full border border-rule bg-paper px-3 py-2.5 text-[14px] placeholder:text-muted/60 focus:border-ink"
          />
        </div>

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
