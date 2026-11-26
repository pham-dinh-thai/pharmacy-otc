'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { fetchCurrentUser } from '@/lib/account';
import { authFetch } from '@/lib/auth';

const LIST_PATH = '/orders';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function ordersPath(value: FormDataEntryValue | null): string {
  const path = String(value ?? '');

  if (path === LIST_PATH || path.startsWith(`${LIST_PATH}?`)) return path;

  return LIST_PATH;
}

function withQuery(
  path: string,
  key: 'error' | 'updated',
  value: string,
): string {
  const url = new URL(path, 'http://localhost');

  url.searchParams.delete('error');
  url.searchParams.delete('updated');
  url.searchParams.set(key, value);

  return `${url.pathname}${url.search}`;
}

async function requireUser(back: string): Promise<void> {
  const user = await fetchCurrentUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(back)}`);
  }
}

function redirectForStatus(res: Response, back: string): void {
  if (res.status === 401) {
    redirect(`/login?next=${encodeURIComponent(back)}`);
  }
  if (res.status === 404) {
    redirect(withQuery(back, 'error', 'notfound'));
  }
  if (res.status === 409) {
    redirect(withQuery(back, 'error', 'conflict'));
  }
  if (res.status === 400 || res.status === 422) {
    redirect(withQuery(back, 'error', 'invalid'));
  }
  if (!res.ok) {
    redirect(withQuery(back, 'error', 'server'));
  }
}

export async function cancelOrderAction(formData: FormData): Promise<void> {
  const id = String(formData.get('orderId') ?? '').trim();
  const back = ordersPath(formData.get('returnTo'));

  await requireUser(back);

  if (!UUID_PATTERN.test(id)) {
    redirect(withQuery(back, 'error', 'missing'));
  }

  let res: Response;
  try {
    res = await authFetch(`/orders/${encodeURIComponent(id)}/cancel`, {
      method: 'PATCH',
    });
  } catch {
    redirect(withQuery(back, 'error', 'server'));
  }

  redirectForStatus(res, back);

  revalidatePath(LIST_PATH);
  redirect(withQuery(back, 'updated', 'cancelled'));
}

export async function reorderOrderAction(formData: FormData): Promise<void> {
  const id = String(formData.get('orderId') ?? '').trim();
  const back = ordersPath(formData.get('returnTo'));

  await requireUser(back);

  if (!UUID_PATTERN.test(id)) {
    redirect(withQuery(back, 'error', 'missing'));
  }

  let res: Response;
  try {
    res = await authFetch(`/orders/${encodeURIComponent(id)}/reorder`, {
      method: 'POST',
    });
  } catch {
    redirect(withQuery(back, 'error', 'server'));
  }

  redirectForStatus(res, back);

  revalidatePath(LIST_PATH);
  revalidatePath('/cart');
  redirect('/cart?updated=reordered');
}
