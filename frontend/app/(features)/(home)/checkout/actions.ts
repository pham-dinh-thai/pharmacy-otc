'use server';

import { redirect } from 'next/navigation';
import { fetchCurrentUser } from '@/lib/account';
import { authFetch } from '@/lib/auth';

type CheckoutErrorCode = 'missing' | 'cart' | 'server';

function checkoutPath(
  productIds: string[],
  error?: CheckoutErrorCode,
): string {
  const params = new URLSearchParams();
  for (const id of productIds) params.append('item', id);
  if (error) params.set('error', error);

  const query = params.toString();
  return query ? `/checkout?${query}` : '/checkout';
}

export async function createCheckoutAction(formData: FormData): Promise<void> {
  const productIds = formData
    .getAll('productIds')
    .map((value) => String(value).trim())
    .filter(Boolean);
  const shippingName = String(formData.get('shippingName') ?? '').trim();
  const shippingAddress = String(formData.get('shippingAddress') ?? '').trim();
  const shippingPhone = String(formData.get('shippingPhone') ?? '').trim();

  // Server Action là entry point công khai: phải tự kiểm tra auth, không chỉ
  // dựa vào việc form chỉ được render cho user đã đăng nhập.
  const user = await fetchCurrentUser();
  if (!user) {
    redirect(
      `/login?next=${encodeURIComponent(checkoutPath(productIds))}`,
    );
  }

  if (
    productIds.length === 0 ||
    !shippingName ||
    !shippingAddress ||
    !shippingPhone
  ) {
    redirect(checkoutPath(productIds, 'missing'));
  }

  let response: Response;
  try {
    response = await authFetch('/checkouts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productIds,
        shippingName,
        shippingAddress,
        shippingPhone,
      }),
    });
  } catch {
    redirect(checkoutPath(productIds, 'server'));
  }

  if (response.status === 401) {
    redirect(
      `/login?next=${encodeURIComponent(checkoutPath(productIds))}`,
    );
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as {
      code?: string;
    };
    const isCartError = [
      'CHECKOUT_NO_ITEMS',
      'CHECKOUT_PRODUCT_NOT_IN_CART',
      'CHECKOUT_PRODUCT_NOT_FOUND',
    ].includes(body.code ?? '');

    redirect(checkoutPath(productIds, isCartError ? 'cart' : 'server'));
  }

  const { id } = (await response.json()) as { id: string };
  redirect(
    typeof id === 'string' && id
      ? `/checkout?created=1&id=${encodeURIComponent(id)}`
      : '/checkout?created=1',
  );
}
