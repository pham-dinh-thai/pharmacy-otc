'use server';

import { redirect } from 'next/navigation';
import { fetchCurrentUser } from '@/lib/account';
import { authFetch } from '@/lib/auth';

type CheckoutErrorCode = 'missing' | 'cart' | 'server';
type ConfirmErrorCode =
  | 'checkout'
  | 'expired'
  | 'status'
  | 'stock'
  | 'server';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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

function confirmPath(checkoutId: string, error?: ConfirmErrorCode): string {
  const params = new URLSearchParams({ confirm: checkoutId });
  if (error) params.set('error', error);

  return `/checkout?${params.toString()}`;
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
  if (typeof id !== 'string' || !UUID_PATTERN.test(id)) {
    redirect(checkoutPath(productIds, 'server'));
  }

  redirect(confirmPath(id));
}

export async function confirmCheckoutAction(formData: FormData): Promise<void> {
  const checkoutId = String(formData.get('checkoutId') ?? '').trim();

  const user = await fetchCurrentUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(confirmPath(checkoutId))}`);
  }

  if (!UUID_PATTERN.test(checkoutId)) {
    redirect(confirmPath(checkoutId, 'checkout'));
  }

  let response: Response;
  try {
    response = await authFetch(
      `/checkouts/${encodeURIComponent(checkoutId)}/confirm`,
      { method: 'PATCH' },
    );
  } catch {
    redirect(confirmPath(checkoutId, 'server'));
  }

  if (response.status === 401) {
    redirect(`/login?next=${encodeURIComponent(confirmPath(checkoutId))}`);
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as {
      code?: string;
    };
    const code = body.code ?? '';

    const error: ConfirmErrorCode =
      code === 'CHECKOUT_NOT_FOUND'
        ? 'checkout'
        : code === 'CHECKOUT_EXPIRED'
          ? 'expired'
          : code === 'CAN_NOT_UPDATE_CHECKOUT_STATUS'
            ? 'status'
            : code === 'INSUFFICIENT_STOCK'
              ? 'stock'
              : 'server';

    redirect(confirmPath(checkoutId, error));
  }

  const { id, orderId } = (await response.json()) as {
    id?: string;
    orderId?: string;
  };

  if (
    typeof id !== 'string' ||
    !id ||
    typeof orderId !== 'string' ||
    !UUID_PATTERN.test(orderId)
  ) {
    redirect(confirmPath(checkoutId, 'server'));
  }

  const params = new URLSearchParams({ done: '1', id, order: orderId });
  redirect(`/checkout?${params.toString()}`);
}
