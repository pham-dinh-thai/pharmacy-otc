'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { fetchCurrentUser, hasPermission } from '@/lib/account';
import { authFetch } from '@/lib/auth';

const LIST_PATH = '/inventories';
const BATCHES_PATH = `${LIST_PATH}/batches`;

function withQuery(path: string, query: Record<string, string>): string {
  const url = new URL(path, 'http://localhost');

  Object.entries(query).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  return `${url.pathname}${url.search}`;
}

function returnPath(value: FormDataEntryValue | null, fallback: string): string {
  const path = String(value ?? '');

  if (path === BATCHES_PATH || path.startsWith(`${BATCHES_PATH}/`)) return path;
  if (path.startsWith(`${BATCHES_PATH}?`)) return path;

  return fallback;
}

function trimmed(value: FormDataEntryValue | null): string {
  return String(value ?? '').trim();
}

async function requirePermission(
  permission: string,
  fallback: string,
): Promise<void> {
  const user = await fetchCurrentUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(fallback)}`);
  }

  if (!user.isSuperAdmin && !hasPermission(user, permission)) {
    redirect(withQuery(fallback, { error: 'forbidden' }));
  }
}

function redirectForStatus(res: Response, back: string): void {
  if (res.status === 401) {
    redirect(`/login?next=${encodeURIComponent(back)}`);
  }
  if (res.status === 403) {
    redirect(withQuery(back, { error: 'forbidden' }));
  }
  if (res.status === 404) {
    redirect(withQuery(back, { error: 'notfound' }));
  }
  if (res.status === 409) {
    redirect(withQuery(back, { error: 'conflict' }));
  }
  if (res.status === 400 || res.status === 422) {
    redirect(withQuery(back, { error: 'invalid' }));
  }
  if (!res.ok) {
    redirect(withQuery(back, { error: 'server' }));
  }
}

function revalidateInventory(batchId: string): void {
  revalidatePath(LIST_PATH);
  revalidatePath(BATCHES_PATH);
  revalidatePath(`${BATCHES_PATH}/${batchId}`);
}

function parseQuantity(
  value: FormDataEntryValue | null,
  allowZero: boolean,
): number | null {
  const raw = trimmed(value);

  if (!/^\d+$/.test(raw)) return null;

  const quantity = Number(raw);

  if (!Number.isSafeInteger(quantity)) return null;
  if (!allowZero && quantity < 1) return null;

  return quantity;
}

export async function issueBatchStock(formData: FormData) {
  const productId = trimmed(formData.get('productId'));
  const batchId = trimmed(formData.get('batchId'));
  const back = returnPath(
    formData.get('returnTo'),
    batchId ? `${BATCHES_PATH}/${batchId}` : BATCHES_PATH,
  );

  await requirePermission('inventories:issue', back);

  const quantity = parseQuantity(formData.get('quantity'), false);

  if (!productId || !batchId || quantity === null) {
    redirect(withQuery(back, { error: 'invalid' }));
  }

  let res: Response;
  try {
    res = await authFetch(
      `/inventories/${encodeURIComponent(productId)}/issue/${encodeURIComponent(batchId)}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity }),
      },
    );
  } catch {
    redirect(withQuery(back, { error: 'server' }));
  }

  redirectForStatus(res, back);

  revalidateInventory(batchId);
  redirect(withQuery(back, { updated: 'issued' }));
}

export async function reconcileBatchStock(formData: FormData) {
  const productId = trimmed(formData.get('productId'));
  const batchId = trimmed(formData.get('batchId'));
  const back = returnPath(
    formData.get('returnTo'),
    batchId ? `${BATCHES_PATH}/${batchId}` : BATCHES_PATH,
  );

  await requirePermission('inventories:reconcile', back);

  const quantity = parseQuantity(formData.get('quantity'), true);

  if (!productId || !batchId || quantity === null) {
    redirect(withQuery(back, { error: 'invalid' }));
  }

  let res: Response;
  try {
    res = await authFetch(
      `/inventories/${encodeURIComponent(productId)}/reconcile/${encodeURIComponent(batchId)}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity }),
      },
    );
  } catch {
    redirect(withQuery(back, { error: 'server' }));
  }

  redirectForStatus(res, back);

  revalidateInventory(batchId);
  redirect(withQuery(back, { updated: 'reconciled' }));
}
