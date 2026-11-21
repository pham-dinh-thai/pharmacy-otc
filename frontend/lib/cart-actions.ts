'use server';

import { cookies } from 'next/headers';
import { getAccessToken } from './auth';
import { MAX_CART_ITEMS } from './cart';
import {
  BACKEND_URL,
  CART_COOKIE,
  CART_COOKIE_MAX_AGE,
  readSetCookie,
} from './session';
import type { CartResponse } from '@/types';

const SECURE_COOKIE = process.env.NODE_ENV === 'production';

async function cartRequest(
  path: string,
  init: RequestInit = {},
): Promise<CartResponse> {
  const token = await getAccessToken();
  const cookieStore = await cookies();
  const guestToken = cookieStore.get(CART_COOKIE)?.value;

  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (guestToken) headers.set('Cookie', `${CART_COOKIE}=${guestToken}`);

  const response = await fetch(`${BACKEND_URL}/carts${path}`, {
    ...init,
    headers,
    cache: 'no-store',
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as {
      code?: string;
      message?: string;
    };

    if (body.code === 'CART_LIMIT_EXCEEDED') {
      throw new Error(`Giỏ hàng chỉ chứa tối đa ${MAX_CART_ITEMS} sản phẩm.`);
    }

    throw new Error(body.message ?? 'Không cập nhật được giỏ hàng.');
  }

  await syncGuestCookie(response.headers);

  return (await response.json()) as CartResponse;
}

async function syncGuestCookie(headers: Headers): Promise<void> {
  const token = readSetCookie(headers, CART_COOKIE);
  if (token === null) return;

  const store = await cookies();
  // Backend xoá cookie guest khi người dùng đã đăng nhập.
  if (!token) {
    store.delete(CART_COOKIE);
    return;
  }

  store.set(CART_COOKIE, token, {
    httpOnly: true,
    secure: SECURE_COOKIE,
    sameSite: 'lax',
    path: '/',
    maxAge: CART_COOKIE_MAX_AGE,
  });
}

export async function fetchCartAction(): Promise<CartResponse> {
  return cartRequest('');
}

export async function addToCartAction(
  productId: string,
  quantity = 1,
): Promise<CartResponse> {
  return cartRequest('/items', {
    method: 'POST',
    body: JSON.stringify({ productId, quantity }),
  });
}

export async function setCartQuantityAction(
  productId: string,
  quantity: number,
): Promise<CartResponse> {
  if (quantity <= 0) return removeFromCartAction(productId);

  return cartRequest(`/items/${productId}`, {
    method: 'PATCH',
    body: JSON.stringify({ quantity }),
  });
}

export async function removeFromCartAction(
  productId: string,
): Promise<CartResponse> {
  return cartRequest(`/items/${productId}`, { method: 'DELETE' });
}

export async function clearCartAction(): Promise<CartResponse> {
  return cartRequest('', { method: 'DELETE' });
}
