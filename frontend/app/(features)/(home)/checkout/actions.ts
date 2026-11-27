'use server';

import { redirect } from 'next/navigation';
import { fetchCurrentUser } from '@/lib/account';
import { authFetch } from '@/lib/auth';

type EditErrorCode =
  | 'checkout'
  | 'expired'
  | 'missing'
  | 'status'
  | 'server';
type ConfirmErrorCode =
  | 'checkout'
  | 'expired'
  | 'status'
  | 'stock'
  | 'server';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const PAYMENT_METHODS = ['cod', 'sepay', 'zalopay', 'vietqr'] as const;
const MAX_NAME_LENGTH = 255;
const MAX_ADDRESS_LENGTH = 500;
const MAX_PHONE_LENGTH = 20;

function editPath(checkoutId: string, error?: EditErrorCode): string {
  const params = new URLSearchParams({ edit: checkoutId });
  if (error) params.set('error', error);

  return `/checkout?${params.toString()}`;
}

function confirmPath(checkoutId: string, error?: ConfirmErrorCode): string {
  const params = new URLSearchParams({ confirm: checkoutId });
  if (error) params.set('error', error);

  return `/checkout?${params.toString()}`;
}

function readDetails(formData: FormData): {
  shippingName: string;
  shippingAddress: string;
  shippingPhone: string;
  paymentMethod: string;
} {
  return {
    shippingName: String(formData.get('shippingName') ?? '').trim(),
    shippingAddress: String(formData.get('shippingAddress') ?? '').trim(),
    shippingPhone: String(formData.get('shippingPhone') ?? '').trim(),
    paymentMethod: String(formData.get('paymentMethod') ?? '').trim(),
  };
}

function validDetails(details: ReturnType<typeof readDetails>): boolean {
  return (
    Boolean(details.shippingName) &&
    details.shippingName.length <= MAX_NAME_LENGTH &&
    Boolean(details.shippingAddress) &&
    details.shippingAddress.length <= MAX_ADDRESS_LENGTH &&
    Boolean(details.shippingPhone) &&
    details.shippingPhone.length <= MAX_PHONE_LENGTH &&
    (PAYMENT_METHODS as readonly string[]).includes(details.paymentMethod)
  );
}

export async function updateCheckoutAction(formData: FormData): Promise<void> {
  const checkoutId = String(formData.get('checkoutId') ?? '').trim();
  const details = readDetails(formData);

  const user = await fetchCurrentUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(editPath(checkoutId))}`);
  }

  if (!UUID_PATTERN.test(checkoutId)) {
    redirect(editPath(checkoutId, 'checkout'));
  }

  if (!validDetails(details)) {
    redirect(editPath(checkoutId, 'missing'));
  }

  let response: Response;
  try {
    response = await authFetch(`/checkouts/${encodeURIComponent(checkoutId)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(details),
    });
  } catch {
    redirect(editPath(checkoutId, 'server'));
  }

  if (response.status === 401) {
    redirect(`/login?next=${encodeURIComponent(editPath(checkoutId))}`);
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as {
      code?: string;
    };
    const code = body.code ?? '';

    const error: EditErrorCode =
      code === 'CHECKOUT_NOT_FOUND'
        ? 'checkout'
        : code === 'CHECKOUT_EXPIRED'
          ? 'expired'
          : code === 'CAN_NOT_UPDATE_CHECKOUT_STATUS'
            ? 'status'
            : 'server';

    redirect(editPath(checkoutId, error));
  }

  redirect(confirmPath(checkoutId));
}

export async function confirmCheckoutAction(formData: FormData): Promise<void> {
  const checkoutId = String(formData.get('checkoutId') ?? '').trim();
  const paymentMethod = String(formData.get('paymentMethod') ?? '').trim();

  const user = await fetchCurrentUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(confirmPath(checkoutId))}`);
  }

  if (!UUID_PATTERN.test(checkoutId)) {
    redirect(confirmPath(checkoutId, 'checkout'));
  }

  if (!(PAYMENT_METHODS as readonly string[]).includes(paymentMethod)) {
    redirect(confirmPath(checkoutId, 'server'));
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

  if (paymentMethod === 'cod') {
    redirect('/orders');
  }

  const params = new URLSearchParams({
    order: orderId,
    checkout: id,
    method: paymentMethod,
  });
  redirect(`/payment?${params.toString()}`);
}
