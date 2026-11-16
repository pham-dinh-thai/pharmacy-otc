'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { authFetch } from '@/lib/auth';
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from '@/lib/session';

export async function handleChangePassword(formData: FormData) {
  const currentPassword = String(formData.get('currentPassword') ?? '');
  const newPassword = String(formData.get('newPassword') ?? '');
  const newPasswordConfirmation = String(
    formData.get('newPasswordConfirmation') ?? '',
  );

  if (!currentPassword || !newPassword || !newPasswordConfirmation) {
    redirect('/account/password?error=missing');
  }

  if (newPassword.length < 8) {
    redirect('/account/password?error=short');
  }

  if (newPassword !== newPasswordConfirmation) {
    redirect('/account/password?error=mismatch');
  }

  let res: Response;
  try {
    res = await authFetch('/authentication/password/change', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        currentPassword,
        newPassword,
        newPasswordConfirmation,
      }),
    });
  } catch {
    redirect('/account/password?error=server');
  }

  if (res.status === 401) redirect('/login');
  if (res.status === 409) redirect('/account/password?error=current');
  if (res.status === 429) redirect('/account/password?error=rate');
  if (!res.ok) redirect('/account/password?error=server');

  // Backend thu hồi toàn bộ refresh token sau khi đổi mật khẩu, kể cả token
  // của thiết bị này. Xoá cookie để buộc đăng nhập lại bằng mật khẩu mới.
  const cookieStore = await cookies();
  cookieStore.delete(ACCESS_TOKEN_COOKIE);
  cookieStore.delete(REFRESH_TOKEN_COOKIE);
  redirect('/login?passwordChanged=1');
}
