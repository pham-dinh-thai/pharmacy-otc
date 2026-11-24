'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { fetchCurrentUser } from '@/lib/account';
import { authFetch } from '@/lib/auth';

export async function saveDeliveryContactAction(formData: FormData) {
  // Server Action là entry point công khai: phải tự kiểm tra auth, không chỉ
  // dựa vào việc form chỉ được render cho user đã đăng nhập.
  const user = await fetchCurrentUser();
  if (!user) redirect('/login?next=%2Faccount');

  const phone = String(formData.get('phone') ?? '').trim();
  const address = String(formData.get('address') ?? '').trim();

  // Cho phép lưu riêng từng phần, nhưng phải có ít nhất một giá trị.
  if (!phone && !address) redirect('/account?error=delivery-missing');

  let response: Response;
  try {
    response = await authFetch('/customers/me/delivery-contact', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, address }),
    });
  } catch {
    redirect('/account?error=server');
  }

  if (response.status === 401) redirect('/login?next=%2Faccount');
  if (!response.ok) redirect('/account?error=server');

  revalidatePath('/account');
  revalidatePath('/checkout');
  redirect('/account?updated=delivery');
}
