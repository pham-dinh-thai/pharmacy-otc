import { cache } from 'react';
import { authFetch } from './auth';
import type { CheckoutDetailResponse, PaymentMethod } from '@/types';

export type CheckoutFetchResult =
  | { checkout: CheckoutDetailResponse; error?: undefined }
  | { checkout?: undefined; error: 'checkout' | 'expired' | 'status' | 'server' };

export type CreateCheckoutResult =
  | { id: string; error?: undefined }
  | { id?: undefined; error: 'cart' | 'server' };

export async function createCheckout(
  productIds: string[],
  shippingName: string,
  shippingAddress: string,
  shippingPhone: string,
  paymentMethod: PaymentMethod = 'cod',
): Promise<CreateCheckoutResult> {
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
        paymentMethod,
      }),
    });
  } catch {
    return { error: 'server' };
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as {
      code?: string;
    };
    const code = body.code ?? '';

    return {
      error: [
        'CHECKOUT_NO_ITEMS',
        'CHECKOUT_PRODUCT_NOT_IN_CART',
        'CHECKOUT_PRODUCT_NOT_FOUND',
      ].includes(code)
        ? 'cart'
        : 'server',
    };
  }

  const { id } = (await response.json()) as { id?: string };

  return typeof id === 'string' && id ? { id } : { error: 'server' };
}

export const fetchCheckoutForConfirmation = cache(
  async (id: string): Promise<CheckoutFetchResult> => {
    let response: Response;

    try {
      response = await authFetch(`/checkouts/${encodeURIComponent(id)}`);
    } catch {
      return { error: 'server' };
    }

    if (response.status === 404) return { error: 'checkout' };
    if (!response.ok) return { error: 'server' };

    const checkout = (await response.json()) as CheckoutDetailResponse;

    if (checkout.status !== 'pending' && checkout.status !== 'confirming') {
      return { error: 'status' };
    }
    if (new Date(checkout.expiresAt).getTime() <= Date.now()) {
      return { error: 'expired' };
    }

    return { checkout };
  },
);
