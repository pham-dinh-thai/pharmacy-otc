import { cache } from 'react';
import { authFetch } from './auth';
import type { CheckoutDetailResponse } from '@/types';

export type CheckoutFetchResult =
  | { checkout: CheckoutDetailResponse; error?: undefined }
  | { checkout?: undefined; error: 'checkout' | 'expired' | 'status' | 'server' };

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

    if (checkout.status !== 'pending') return { error: 'status' };
    if (new Date(checkout.expiresAt).getTime() <= Date.now()) {
      return { error: 'expired' };
    }

    return { checkout };
  },
);
