import { Suspense } from 'react';
import { AuthShell } from '@/components/auth/AuthShell';
import { AuthField } from '@/components/auth/AuthField';
import { fetchCurrentUser } from '@/lib/account';
import { handleChangePassword } from './actions';

const ERROR_MESSAGES: Record<string, string> = {
  missing: 'Nhập đầy đủ mật khẩu hiện tại và mật khẩu mới.',
  short: 'Mật khẩu mới cần ít nhất 8 ký tự.',
  mismatch: 'Mật khẩu mới nhập lại không khớp.',
  current: 'Mật khẩu hiện tại không đúng.',
  rate: 'Bạn thử quá nhiều lần. Chờ một phút rồi thử lại.',
  server: 'Không đổi được mật khẩu. Kiểm tra kết nối rồi thử lại.',
};

async function ChangePasswordMessage({
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

async function FirstLoginNotice() {
  const user = await fetchCurrentUser();

  if (!user?.mustChangePassword) return null;

  return (
    <p
      role="status"
      className="mb-5 border-l-2 border-accent bg-accent-soft px-3 py-2 text-[13px] leading-5 text-ink"
    >
      Đây là lần đăng nhập đầu tiên. Bạn cần đặt mật khẩu mới trước khi vào
      workspace.
    </p>
  );
}

export default function ChangePasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  return (
    <AuthShell
      title="Đổi mật khẩu"
      intro="Nhập mật khẩu hiện tại để xác nhận, sau đó đặt mật khẩu mới."
    >
      <Suspense fallback={null}>
        <FirstLoginNotice />
        <ChangePasswordMessage searchParams={searchParams} />
      </Suspense>

      <form action={handleChangePassword} className="space-y-5">
        <AuthField
          label="Mật khẩu hiện tại"
          name="currentPassword"
          type="password"
          autoComplete="current-password"
          required
        />

        <AuthField
          label="Mật khẩu mới"
          name="newPassword"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
        />

        <AuthField
          label="Nhập lại mật khẩu mới"
          name="newPasswordConfirmation"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
        />

        <button
          type="submit"
          className="w-full bg-accent py-3 text-[13px] font-semibold text-paper transition-colors hover:bg-ink"
        >
          Lưu mật khẩu mới
        </button>
      </form>

      <p className="mt-6 border-t border-rule pt-4 text-[13px] leading-5 text-muted">
        Đổi mật khẩu sẽ đăng xuất tài khoản khỏi mọi thiết bị. Bạn cần đăng nhập
        lại bằng mật khẩu mới.
      </p>
    </AuthShell>
  );
}
